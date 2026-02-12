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
    <div className="flex items-center justify-between px-4 py-2 bg-mars-dark border-t border-gray-800 text-xs text-gray-400">
      <span>
        Network: {remoteConnected === true ? (
          <span className="text-green-400">Connected</span>
        ) : remoteConnected === false ? (
          <span className="text-amber-400">Checking...</span>
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </span>
      <span>Mars Credit Miner {version ? `v${version}` : ''}</span>
    </div>
  );
}
