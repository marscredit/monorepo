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
      <div className="min-h-screen bg-mars-black text-white flex items-center justify-center">
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
    <div className="min-h-screen bg-mars-black text-white flex flex-col">
      <header className="border-b border-gray-800 px-4 py-2">
        <h1 className="text-xl font-bold text-mars-red">Mars Credit Miner</h1>
      </header>
      <TabBar />
      <main className="flex-1 overflow-auto">
        {activeMinerIndex != null ? (
          <MinerTab minerIndex={activeMinerIndex} />
        ) : (
          <div className="p-8 text-gray-400">Select or add a miner tab.</div>
        )}
      </main>
      <StatusBar />
    </div>
  );
}

export default App;
