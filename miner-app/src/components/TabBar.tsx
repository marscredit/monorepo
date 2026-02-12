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
    setMinerIndices([...minerIndices, idx].sort((a, b) => a - b));
    setActiveMinerIndex(idx);
  };

  const removeTab = (idx: number) => {
    if (!api) return;
    api.miner.removeTab(idx);
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
    <div className="flex items-center gap-1 border-b border-gray-800 bg-mars-dark px-2 py-1">
      {minerIndices.map((idx) => (
        <div key={idx} className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveMinerIndex(idx)}
            className={`px-3 py-2 rounded-t text-sm ${activeMinerIndex === idx ? 'bg-mars-black text-mars-red' : 'text-gray-400 hover:text-white'}`}
          >
            Miner {idx}
          </button>
          {minerIndices.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTab(idx); }}
              className="p-1 text-gray-500 hover:text-red-400"
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
        className="px-3 py-2 text-gray-400 hover:text-white text-lg"
        title="Add miner"
      >
        +
      </button>
    </div>
  );
}