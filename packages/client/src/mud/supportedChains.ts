/*
 * The supported chains.
 * By default, there are only two chains here:
 *
 * - mudFoundry, the chain running on anvil that pnpm dev
 *   starts by default. It is similar to the viem anvil chain
 *   (see https://viem.sh/docs/clients/test.html), but with the
 *   basefee set to zero to avoid transaction fees.
 * - latticeTestnet, our public test network.
 *

 */

import { MUDChain, latticeTestnet, mudFoundry } from '@latticexyz/common/chains';

export const caldera = {
  name: 'Primodium Testnet',
  id: 10017,
  network: 'caldera',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: {
      http: ['https://primodium-sepolia.rpc.caldera.xyz/http'],
      webSocket: ['wss://primodium-sepolia.rpc.caldera.xyz/wss'],
    },
    public: {
      http: ['https://primodium-sepolia.rpc.caldera.xyz/http'],
      webSocket: ['wss://primodium-sepolia.rpc.caldera.xyz/wss'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SepoliaExplorer',
      url: 'https://primodium-sepolia.explorer.caldera.xyz',
    },
  },
  // faucetUrl: "https://faucet.testnet-mud-services.linfra.xyz",
} as const satisfies MUDChain;

/*
 * See https://mud.dev/tutorials/minimal/deploy#run-the-user-interface
 * for instructions on how to add networks.
 */
export const supportedChains: MUDChain[] = [mudFoundry, latticeTestnet, caldera];
