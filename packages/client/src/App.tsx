import { SyncStep } from '@latticexyz/store-sync';
import { useMUD } from './MUDContext';

export const App = () => {
  const {
    network: { useStore, TABLES_TO_FETCH },
  } = useMUD();

  const syncProgress = useStore((state) => state.syncProgress);

  console.log('syncProgress', syncProgress);

  const ready = syncProgress.step === SyncStep.LIVE;

  return (
    <div>
      <p>Printing snapshot hydration progress into console</p>
      <div className={`fixed flex flex-col z-50 bottom-0 right-1/2 translate-x-1/2`}>
        <div className="flex flex-col w-[400px] p-4 justify-items rounded bg-slate-800 relative">
          <h5 className="text-center text-2xl font-bold mb-2">{syncProgress.message}</h5>
          <div className="flex flex-wrap items-center mb-2">
            <span>Tables:</span>
            {TABLES_TO_FETCH.map((name, index) => (
              <span className="m-0.5 p-1 rounded-sm bg-primary/25" key={`table-${index}`}>
                {name}
              </span>
            ))}
          </div>
          <button className="btn btn-primary btn-full" disabled={!ready}>
            {ready ? 'Leeeroooy' : `${syncProgress.percentage}%`}
          </button>
        </div>
      </div>
    </div>
  );
};
