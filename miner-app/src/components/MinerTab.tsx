import { useState, useEffect } from 'react';
import { LogViewer, useMinerLogs } from './LogViewer';
import { WalletPanel } from './WalletPanel';

interface MinerState {
  running: boolean;
  pid?: number;
  rpcUrl: string;
  config: { minerThreads: number; cacheMB: number; etherbase?: string };
}

export function MinerTab({ minerIndex }: { minerIndex: number }) {
  const [state, setState] = useState<MinerState | null>(null);
  const [threads, setThreads] = useState(1);
  const [syncing, setSyncing] = useState<{ current: string; highest: string } | null>(null);
  const [peerCount, setPeerCount] = useState<string>('—');
  const [hashrate, setHashrate] = useState<string>('—');
  const logs = useMinerLogs(minerIndex);
  const api = window.electronAPI;

  useEffect(() => {
    if (!api) return;
    const load = async () => {
      const s = await api.miner.getState(minerIndex) as MinerState | null;
      setState(s);
      if (s?.config?.minerThreads) setThreads(s.config.minerThreads);
    };
    load();
    const unsub = api.miner.onState((idx, newState) => {
      if (idx !== minerIndex) return;
      setState((prev) => ({ ...prev!, ...newState } as MinerState));
    });
    return unsub;
  }, [minerIndex, api]);

  useEffect(() => {
    if (!api || !state?.rpcUrl) return;
    const poll = async () => {
      try {
        const [sync, peers, hash] = await Promise.all([
          api.network.ethSyncing(state.rpcUrl),
          api.network.netPeerCount(state.rpcUrl),
          api.network.ethHashrate(state.rpcUrl),
        ]);
        if (sync && typeof sync === 'object') {
          setSyncing({ current: sync.currentBlock, highest: sync.highestBlock });
        } else {
          setSyncing(null);
        }
        setPeerCount(peers ? parseInt(peers, 16).toString() : '—');
        setHashrate(hash ? (parseInt(hash, 16) / 1e6).toFixed(2) + ' MH/s' : '—');
      } catch {
        setPeerCount('—');
        setHashrate('—');
      }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [api, state?.rpcUrl]);

  const handleStart = async () => {
    if (!api) return;
    const addr = await api.wallet.getStoredAddress(minerIndex);
    await api.miner.start(minerIndex, { minerThreads: threads, etherbase: addr ?? undefined });
    const s = await api.miner.getState(minerIndex) as MinerState;
    setState(s);
  };

  const handleStop = async () => {
    if (!api) return;
    api.miner.stop(minerIndex);
    setState((prev) => prev ? { ...prev, running: false, pid: undefined } : null);
  };

  if (!api) return null;

  const syncPercent = syncing
    ? (Number(BigInt(syncing.current)) / Number(BigInt(syncing.highest)) * 100).toFixed(1)
    : '100';

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {state?.running ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Stop mining
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="px-4 py-2 bg-mars-red rounded hover:bg-mars-accent"
            >
              Start mining
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Threads</label>
          <input
            type="number"
            min={1}
            max={16}
            value={threads}
            onChange={(e) => setThreads(parseInt(e.target.value, 10) || 1)}
            className="w-16 bg-mars-dark rounded px-2 py-1 text-sm"
          />
        </div>
        {state?.running && (
          <>
            <span className="text-sm text-gray-400">Hashrate: <span className="text-green-400">{hashrate}</span></span>
            <span className="text-sm text-gray-400">Peers: {peerCount}</span>
          </>
        )}
      </div>

      {syncing && (
        <div className="text-sm">
          <span className="text-gray-400">Sync: </span>
          <span className="text-white">{syncPercent}%</span>
          <span className="text-gray-500 ml-2">({syncing.current} / {syncing.highest})</span>
        </div>
      )}

      <WalletPanel minerIndex={minerIndex} rpcUrl={state?.rpcUrl ?? null} />

      <div className="flex-1 min-h-0 flex flex-col">
        <p className="text-sm text-gray-400 mb-1">Logs</p>
        <LogViewer minerIndex={minerIndex} logs={logs} />
      </div>
    </div>
  );
}
