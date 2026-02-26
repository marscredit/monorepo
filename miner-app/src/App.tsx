import { useState, useEffect } from 'react';
import { Onboarding } from '@/components/Onboarding';
import { TabBar } from '@/components/TabBar';
import { MinerTab } from '@/components/MinerTab';
import { StatusBar } from '@/components/StatusBar';
import { useAppStore } from '@/stores/appStore';

function App() {
  const [ready, setReady] = useState(false);
  const { hasCompletedOnboarding, setHasCompletedOnboarding, activeMinerIndex } = useAppStore();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setReady(true);
      return;
    }
    window.electronAPI.config.getHasCompletedOnboarding().then((done) => {
      setHasCompletedOnboarding(done);
      setReady(true);
    });
  }, [setHasCompletedOnboarding]);

  if (!ready) {
    return (
      <div className="h-screen bg-bg text-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setHasCompletedOnboarding(true);
        }}
      />
    );
  }

  return (
    <div className="h-screen bg-bg text-white flex flex-col overflow-hidden">
      {/* Header / drag region for frameless window */}
      <header
        className="border-b border-mars-900/30 px-4 py-2 pl-20 flex items-center shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <h1
          className="text-xl font-bold text-mars-400"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          Mars Credit Miner
        </h1>
      </header>
      <TabBar />
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeMinerIndex != null ? (
          <MinerTab minerIndex={activeMinerIndex} />
        ) : (
          <div className="p-8 text-text-lo">Select or add a miner tab.</div>
        )}
      </main>
      <StatusBar />
    </div>
  );
}

export default App;
