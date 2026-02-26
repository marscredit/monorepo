import { useState, useEffect, useRef } from 'react';
import { LogViewer, useMinerLogs } from './LogViewer';
import { WalletPanel } from './WalletPanel';
import { MinerSetup } from './MinerSetup';

function formatHashrate(hashesPerSecond: number): string {
  if (hashesPerSecond <= 0) return '0 H/s';
  if (hashesPerSecond < 1_000) return `${hashesPerSecond.toFixed(0)} H/s`;
  if (hashesPerSecond < 1_000_000) return `${(hashesPerSecond / 1_000).toFixed(2)} KH/s`;
  if (hashesPerSecond < 1_000_000_000) return `${(hashesPerSecond / 1_000_000).toFixed(2)} MH/s`;
  return `${(hashesPerSecond / 1_000_000_000).toFixed(2)} GH/s`;
}

interface MinerState {
  running: boolean;
  pid?: number;
  rpcUrl: string;
  config: { minerThreads: number; cacheMB: number; etherbase?: string };
}

export function MinerTab({ minerIndex }: { minerIndex: number }) {
  const [setupDone, setSetupDone] = useState<boolean | null>(null);
  const [state, setState] = useState<MinerState | null>(null);
  const [threads, setThreads] = useState(1);
  const [starting, setStarting] = useState(false);
  const [syncing, setSyncing] = useState<{ current: string; highest: string } | null>(null);
  const [peerCount, setPeerCount] = useState<string>('—');
  const [hashrate, setHashrate] = useState<string>('—');
  const logs = useMinerLogs(minerIndex);
  const api = window.electronAPI;

  useEffect(() => {
    if (!api) return;
    api.config.getMinerTabConfig(minerIndex).then((tabConfig) => {
      setSetupDone(!!tabConfig?.walletAddress);
    });
  }, [minerIndex, api]);

  useEffect(() => {
    if (!api || !setupDone) return;
    const load = async () => {
      const s = await api.miner.getState(minerIndex) as MinerState | null;
      setState(s);
      if (s?.config?.minerThreads) setThreads(s.config.minerThreads);
      setStarting(false);
    };
    load();
    const unsub = api.miner.onState((idx, newState) => {
      if (idx !== minerIndex) return;
      setState((prev) => ({ ...prev!, ...newState } as MinerState));
      setStarting(false);
    });
    return unsub;
  }, [minerIndex, api, setupDone]);

  const sealTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (!api || !state?.rpcUrl) return;

    const estimateFromLogs = (): number => {
      const ts = sealTimestamps.current;
      if (ts.length < 2) return 0;
      const elapsed = (ts[ts.length - 1] - ts[0]) / 1000;
      if (elapsed <= 0) return 0;
      const avgBlockTime = elapsed / (ts.length - 1);
      return 131_072 / avgBlockTime;
    };

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

        const rpcRate = hash ? parseInt(hash, 16) : 0;
        if (rpcRate > 0) {
          setHashrate(formatHashrate(rpcRate));
        } else {
          const est = estimateFromLogs();
          setHashrate(est > 0 ? `~${formatHashrate(est)}` : '—');
        }
      } catch {
        setPeerCount('—');
        setHashrate('—');
      }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [api, state?.rpcUrl]);

  const lastLogCount = useRef(0);
  useEffect(() => {
    if (!state?.running) {
      sealTimestamps.current = [];
      lastLogCount.current = 0;
      return;
    }
    const newLogs = logs.slice(lastLogCount.current);
    lastLogCount.current = logs.length;
    for (const entry of newLogs) {
      const lower = entry.line.toLowerCase();
      if (lower.includes('successfully sealed new block') || lower.includes('mined potential block')) {
        sealTimestamps.current.push(entry.time);
        if (sealTimestamps.current.length > 20) {
          sealTimestamps.current = sealTimestamps.current.slice(-20);
        }
      }
    }
  }, [logs, state?.running]);

  const handleStart = async () => {
    if (!api || starting) return;
    setStarting(true);
    try {
      const addr = await api.wallet.getStoredAddress(minerIndex);
      await api.miner.start(minerIndex, { minerThreads: threads, etherbase: addr ?? undefined });
      const s = await api.miner.getState(minerIndex) as MinerState;
      setState(s);
    } catch (e) {
      console.error('Failed to start miner:', e);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    if (!api) return;
    try {
      await api.miner.stop(minerIndex);
    } catch (e) {
      console.error('Failed to stop miner:', e);
    }
    setState((prev) => prev ? { ...prev, running: false, pid: undefined } : null);
  };

  if (!api) return null;

  if (setupDone === null) {
    return (
      <div className="flex items-center justify-center h-full text-text-lo">
        Loading...
      </div>
    );
  }

  if (!setupDone) {
    return (
      <MinerSetup
        minerIndex={minerIndex}
        onComplete={() => setSetupDone(true)}
      />
    );
  }

  const syncPercent = syncing
    ? (Number(BigInt(syncing.current)) / Number(BigInt(syncing.highest)) * 100).toFixed(1)
    : '100';

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          {state?.running ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-5 py-2.5 bg-red-600 rounded-xl font-semibold hover:bg-red-500 transition-all"
            >
              Stop mining
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)] disabled:opacity-50"
            >
              {starting ? 'Starting...' : 'Start mining'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-lo">Threads</label>
          <input
            type="number"
            min={1}
            max={16}
            value={threads}
            onChange={(e) => setThreads(parseInt(e.target.value, 10) || 1)}
            className="w-16 bg-bg-panel rounded-xl px-2 py-1 text-sm border border-mars-900/50 focus:border-mars-400 outline-none"
          />
        </div>
        {state?.running && (
          <>
            <span className="text-sm text-text-lo">Hashrate: <span className="text-green-400">{hashrate}</span></span>
            <span className="text-sm text-text-lo">Peers: {peerCount}</span>
          </>
        )}
      </div>

      {syncing && (
        <div className="text-sm">
          <span className="text-text-lo">Sync: </span>
          <span className="text-white">{syncPercent}%</span>
          <span className="text-text-lo ml-2">({syncing.current} / {syncing.highest})</span>
        </div>
      )}

      <WalletPanel minerIndex={minerIndex} rpcUrl={state?.rpcUrl ?? null} />

      <div className="flex-1 min-h-0 flex flex-col">
        <p className="text-sm text-text-lo mb-1">Logs</p>
        <LogViewer minerIndex={minerIndex} logs={logs} />
      </div>
    </div>
  );
}
