import { useState, useEffect } from 'react';

export function WalletPanel({ minerIndex, rpcUrl }: { minerIndex: number; rpcUrl: string | null }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('—');
  const api = window.electronAPI;

  useEffect(() => {
    if (!api) return;
    api.wallet.getStoredAddress(minerIndex).then(setAddress);
  }, [minerIndex, api]);

  useEffect(() => {
    if (!api || !address) return;
    const fetchBalance = () => {
      api.network.getBalance(rpcUrl, address).then((r) => setBalance(r.mars));
    };
    fetchBalance();
    const t = setInterval(fetchBalance, 10000);
    return () => clearInterval(t);
  }, [api, address, rpcUrl]);

  if (!address) {
    return (
      <div className="p-3 bg-bg-panel rounded-xl text-text-lo text-sm">
        No wallet set. Complete onboarding or add an address in Settings.
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address!);
  };

  return (
    <div className="p-3 bg-bg-panel rounded-xl border border-mars-900/30">
      <p className="text-xs text-text-lo mb-1">Mining address</p>
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono break-all flex-1">{address}</code>
        <button
          type="button"
          onClick={copyAddress}
          className="px-2.5 py-1 text-xs bg-bg-muted rounded-xl hover:bg-mars-400 transition-colors"
        >
          Copy
        </button>
      </div>
      <p className="text-xs text-text-lo mt-2">Balance: <span className="text-white">{balance}</span> MARS</p>
    </div>
  );
}
