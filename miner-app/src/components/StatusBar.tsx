import { useState, useEffect } from 'react';

export function StatusBar() {
  const [version, setVersion] = useState<string>('');
  const [remoteConnected, setRemoteConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.app.getVersion().then(setVersion);
    window.electronAPI.network.getRemoteRpcUrl().then(() => {
      setRemoteConnected(true);
    }).catch(() => setRemoteConnected(false));
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-bg-panel border-t border-mars-900/30 text-xs text-text-lo">
      <span>
        Network: {remoteConnected === true ? (
          <span className="text-green-400">Connected</span>
        ) : remoteConnected === false ? (
          <span className="text-amber-400">Checking...</span>
        ) : (
          <span className="text-text-lo">—</span>
        )}
      </span>
      <span>Mars Credit Miner {version ? `v${version}` : ''}</span>
    </div>
  );
}
