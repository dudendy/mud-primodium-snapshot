/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { createPublicClient, fallback, webSocket, http, createWalletClient, Hex, parseEther, ClientConfig } from 'viem';
import { createFaucetService } from '@latticexyz/services/faucet';
import { syncToZustand } from '@latticexyz/store-sync/zustand';
import { getNetworkConfig } from './getNetworkConfig';
import IWorldAbi from 'contracts/out/IWorld.sol/IWorld.abi.json';
import { createBurnerAccount, getContract, transportObserver, ContractWrite, resourceToHex } from '@latticexyz/common';
import { Subject, share } from 'rxjs';

/*
 * Import our MUD config, which includes strong types for
 * our tables and other config options. We use this to generate
 * things like RECS components and get back strong types for them.
 *
 * See https://mud.dev/templates/typescript/contracts#mudconfigts
 * for the source of this information.
 */
import mudConfig from 'contracts/mud.config';

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;

export async function setupNetwork() {
  const networkConfig = await getNetworkConfig();

  /*
   * Create a viem public (read only) client
   * (https://viem.sh/docs/clients/public.html)
   */
  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback([webSocket(), http()])),
    pollingInterval: 1000,
  } as const satisfies ClientConfig;

  const publicClient = createPublicClient(clientOptions);

  /*
   * Create a temporary wallet and a viem client for it
   * (see https://viem.sh/docs/clients/wallet.html).
   */
  const burnerAccount = createBurnerAccount(networkConfig.privateKey as Hex);
  const burnerWalletClient = createWalletClient({
    ...clientOptions,
    account: burnerAccount,
  });

  /*
   * Create an observable for contract writes that we can
   * pass into MUD dev tools for transaction observability.
   */
  const write$ = new Subject<ContractWrite>();

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    publicClient,
    walletClient: burnerWalletClient,
    onWrite: (write) => write$.next(write),
  });

  const TABLES = mudConfig.tables;
  const TABLES_TO_FETCH = [
    // TABLES.Score.name,
    // TABLES.Alliance.name,
    // TABLES.Home.name,
    // TABLES.P_Asteroid.name,
    // TABLES.AsteroidCount.name,
    // TABLES.Counter.name,
    // TABLES.P_GameConfig.name,
    // TABLES.Spawned.name,
    // TABLES.Position.name,
    // TABLES.RockType.name,
    // TABLES.Dimensions.name,
    // TABLES.P_Terrain.name,
    // TABLES.P_UnitProdTypes.name,
    // TABLES.P_UnitProdMultiplier.name,
    // TABLES.SetItemUnitFactories.name,
    // TABLES.SetUnitFactories.name,

    // TABLES.P_UnitPrototypes.name,
    // TABLES.P_Unit.name,

    // TABLES.QueueUnits.name,
    // TABLES.QueueItemUnits.name,
    // TABLES.UnitLevel.name,
    // TABLES.UnitCount.name,

    // TABLES.ProducedUnit.name,
    // TABLES.MarketplaceOrder.name,
    // TABLES.Motherlode.name,
    // TABLES.RockType.name,
    // TABLES.ResourceCount.name,
    // TABLES.OwnedMotherlodes.name,
    // TABLES.OwnedBy.name,
    // TABLES.Home.name,
    // TABLES.LastClaimedAt.name,

    // TABLES.UnitCount.name,
    // TABLES.RockType.name,
    // TABLES.ArrivalCount.name,
    // TABLES.MapArrivals.name,

    // TABLES.Position.name,
    // TABLES.LastClaimedAt.name,
    TABLES.UnitLevel.name,
  ];

  /*
   * Sync on-chain state into RECS and keeps our client in sync.
   * Uses the MUD indexer if available, otherwise falls back
   * to the viem publicClient to make RPC calls to fetch MUD
   * events from the chain.
   */
  const { tables, useStore, latestBlock$, storedBlockLogs$, waitForTransaction } = await syncToZustand({
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: 'https://caldera-mud2-indexer.primodium.ai/trpc',
    filters: Object.entries(mudConfig.tables)
      .filter(([, table]) => TABLES_TO_FETCH.includes(table.name)) // filter for desired tables
      .map(([, table]) => {
        const tableId = resourceToHex({
          type: 'table',
          namespace: mudConfig.namespace,
          name: table.name,
        });

        return {
          tableId,
        };
      }),
  });

  /*
   * If there is a faucet, request (test) ETH if you have
   * less than 1 ETH. Repeat every 20 seconds to ensure you don't
   * run out.
   */
  if (networkConfig.faucetServiceUrl) {
    const address = burnerAccount.address;
    console.info('[Dev Faucet]: Player address -> ', address);

    const faucet = createFaucetService(networkConfig.faucetServiceUrl);

    const requestDrip = async () => {
      const balance = await publicClient.getBalance({ address });
      console.info(`[Dev Faucet]: Player balance -> ${balance}`);
      const lowBalance = balance < parseEther('1');
      if (lowBalance) {
        console.info('[Dev Faucet]: Balance is low, dripping funds to player');
        // Double drip
        await faucet.dripDev({ address });
        await faucet.dripDev({ address });
      }
    };

    requestDrip();
    // Request a drip every 20 seconds
    setInterval(requestDrip, 20000);
  }

  return {
    tables,
    useStore,
    publicClient,
    walletClient: burnerWalletClient,
    latestBlock$,
    storedBlockLogs$,
    waitForTransaction,
    worldContract,
    write$: write$.asObservable().pipe(share()),
    TABLES_TO_FETCH,
  };
}
