import { useState, useEffect, useRef } from 'react';

export type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'mining' | 'network';

interface LogLine {
  id: number;
  minerIndex: number;
  line: string;
  source: 'stdout' | 'stderr';
  time: number;
}

function getLogLevel(line: string): LogLevel {
  const l = line.toLowerCase();
  if (l.includes('error') || l.includes('fatal')) return 'error';
  if (l.includes('warn')) return 'warn';
  if (l.includes('mined') || l.includes('block') || l.includes('mining')) return 'mining';
  if (l.includes('peer') || l.includes('p2p') || l.includes('sync')) return 'network';
  return 'info';
}

export function LogViewer({
  minerIndex,
  logs,
  initialFilter = 'all',
  maxLines = 500,
}: {
  minerIndex: number;
  logs: LogLine[];
  initialFilter?: LogLevel;
  maxLines?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogLevel>(initialFilter);
  const filtered = logs.filter((l) => {
    if (l.minerIndex !== minerIndex) return false;
    if (filterLevel === 'all') return true;
    const level = getLogLevel(l.line);
    if (filterLevel === 'error') return level === 'error';
    if (filterLevel === 'warn') return level === 'warn' || level === 'error';
    if (filterLevel === 'mining') return level === 'mining';
    if (filterLevel === 'network') return level === 'network';
    return true;
  }).slice(-maxLines);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const levelColors: Record<LogLevel, string> = {
    all: 'text-gray-300',
    info: 'text-gray-300',
    warn: 'text-amber-400',
    error: 'text-red-400',
    mining: 'text-green-400',
    network: 'text-blue-400',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 py-1 border-b border-gray-700">
        {(['all', 'info', 'warn', 'error', 'mining', 'network'] as LogLevel[]).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setFilterLevel(level)}
            className={`text-xs px-2 py-1 rounded ${filterLevel === level ? 'bg-mars-red' : 'bg-mars-dark'}`}
          >
            {level}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs p-2 bg-black/50 mt-1 rounded"
        style={{ minHeight: 120 }}
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`${levelColors[getLogLevel(item.line)]} ${item.source === 'stderr' ? 'text-red-300' : ''}`}
          >
            {item.line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useMinerLogs(minerIndex: number | null) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!window.electronAPI || minerIndex == null) return;
    const unsub = window.electronAPI.miner.onLog((idx, line, source) => {
      if (idx !== minerIndex) return;
      setLogs((prev) => [...prev.slice(-499), { id: ++idRef.current, minerIndex: idx, line, source, time: Date.now() }]);
    });
    return unsub;
  }, [minerIndex]);

  return logs;
}
