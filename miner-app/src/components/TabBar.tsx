import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

export function TabBar() {
  const { minerIndices, activeMinerIndex, setActiveMinerIndex, setMinerIndices } = useAppStore();
  const api = window.electronAPI;

  const loadTabs = async () => {
    if (!api) return;
    const indices = await api.miner.getTabIndices();
    if (indices.length === 0) {
      const first = await api.miner.addTab();
      setMinerIndices([first]);
      setActiveMinerIndex(first);
    } else {
      setMinerIndices(indices);
      setActiveMinerIndex(activeMinerIndex ?? indices[0]);
    }
  };

  const addTab = async () => {
    if (!api) return;
    const idx = await api.miner.addTab();
    await api.config.upsertMinerTab({ minerIndex: idx, minerThreads: 1, cacheMB: 4096 });
    setMinerIndices([...minerIndices, idx].sort((a, b) => a - b));
    setActiveMinerIndex(idx);
  };

  const removeTab = async (idx: number) => {
    if (!api) return;
    api.miner.removeTab(idx);
    await api.config.removeMinerTab(idx);
    const remaining = minerIndices.filter((i) => i !== idx);
    setMinerIndices(remaining);
    if (activeMinerIndex === idx) {
      setActiveMinerIndex(remaining[0] ?? null);
    }
  };

  useEffect(() => {
    loadTabs();
  }, []);

  return (
    <div className="flex items-center gap-1 border-b border-mars-900/30 bg-bg-panel px-2 py-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      {minerIndices.map((idx) => (
        <div key={idx} className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveMinerIndex(idx)}
            className={`px-3 py-2 rounded-t-xl text-sm font-medium transition-colors ${
              activeMinerIndex === idx
                ? 'bg-bg text-mars-400'
                : 'text-text-lo hover:text-text-hi'
            }`}
          >
            Miner {idx}
          </button>
          {minerIndices.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTab(idx); }}
              className="p-1 text-text-lo hover:text-red-400 transition-colors"
              title="Remove miner"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addTab}
        className="px-3 py-2 text-text-lo hover:text-text-hi text-lg transition-colors"
        title="Add miner"
      >
        +
      </button>
    </div>
  );
}
