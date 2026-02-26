import { useState, useEffect } from 'react';

interface MinerSetupProps {
  minerIndex: number;
  onComplete: (address: string) => void;
}

export function MinerSetup({ minerIndex, onComplete }: MinerSetupProps) {
  const [mode, setMode] = useState<'choose' | 'enter' | 'generate'>('choose');
  const [globalAddress, setGlobalAddress] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [threads, setThreads] = useState(1);
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; mnemonic: string; privateKey: string } | null>(null);
  const [keystorePassword, setKeystorePassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const api = window.electronAPI;

  useEffect(() => {
    if (!api) return;
    api.wallet.getStoredAddress(1).then((addr) => setGlobalAddress(addr));
  }, [api]);

  const handleUseExisting = async () => {
    if (!api || !globalAddress) return;
    setSaving(true);
    setError(null);
    try {
      await api.config.setMinerTabWalletAddress(minerIndex, globalAddress);
      await api.config.upsertMinerTab({ minerIndex, walletAddress: globalAddress, minerThreads: threads });
      onComplete(globalAddress);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const handleCustomAddress = async () => {
    if (!api || !customAddress.trim()) return;
    setError(null);
    const valid = await api.wallet.isValidAddress(customAddress.trim());
    if (!valid) {
      setError('Invalid Ethereum address');
      return;
    }
    setSaving(true);
    try {
      await api.config.setMinerTabWalletAddress(minerIndex, customAddress.trim());
      await api.config.upsertMinerTab({ minerIndex, walletAddress: customAddress.trim(), minerThreads: threads });
      onComplete(customAddress.trim());
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!api) return;
    setError(null);
    try {
      const w = await api.wallet.generate();
      setGeneratedWallet(w);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSaveGenerated = async () => {
    if (!api || !generatedWallet) return;
    setSaving(true);
    setError(null);
    try {
      await api.wallet.writeKeystoreToMiner(minerIndex, generatedWallet.privateKey, keystorePassword || 'mars');
      if (keystorePassword) {
        await api.wallet.saveMnemonic(generatedWallet.mnemonic, keystorePassword);
      }
      await api.config.setMinerTabWalletAddress(minerIndex, generatedWallet.address);
      await api.config.upsertMinerTab({ minerIndex, walletAddress: generatedWallet.address, minerThreads: threads });
      onComplete(generatedWallet.address);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  if (!api) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h2 className="text-xl font-bold text-mars-400 mb-1">Set up Miner {minerIndex}</h2>
          <p className="text-text-lo text-sm">Configure a wallet address for this miner before starting.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-600 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {mode === 'choose' && !generatedWallet && (
          <div className="space-y-3">
            {globalAddress && (
              <button
                type="button"
                onClick={handleUseExisting}
                disabled={saving}
                className="w-full p-4 bg-bg-panel rounded-xl border border-mars-900/50 text-left hover:border-mars-400 transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-white mb-1">Use existing address</p>
                <p className="text-xs text-text-lo font-mono break-all">{globalAddress}</p>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMode('enter')}
              className="w-full p-4 bg-bg-panel rounded-xl border border-mars-900/50 text-left hover:border-mars-400 transition-colors"
            >
              <p className="font-medium text-white">Enter a different address</p>
              <p className="text-xs text-text-lo">Paste any valid Ethereum/Mars Credit address</p>
            </button>

            <button
              type="button"
              onClick={() => { setMode('generate'); handleGenerate(); }}
              className="w-full p-4 bg-bg-panel rounded-xl border border-mars-900/50 text-left hover:border-mars-400 transition-colors"
            >
              <p className="font-medium text-white">Generate a new wallet</p>
              <p className="text-xs text-text-lo">Creates a new address with mnemonic backup</p>
            </button>
          </div>
        )}

        {mode === 'enter' && (
          <div className="space-y-3">
            <input
              className="w-full bg-bg rounded-xl p-3 text-sm font-mono border border-mars-900/50 focus:border-mars-400 outline-none"
              placeholder="0x..."
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="px-4 py-2 bg-bg-muted rounded-xl text-text-lo hover:text-text-hi transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCustomAddress}
                disabled={saving || !customAddress.trim()}
                className="px-5 py-2 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Use this address'}
              </button>
            </div>
          </div>
        )}

        {mode === 'generate' && generatedWallet && (
          <div className="space-y-3">
            <div className="p-4 bg-bg-panel rounded-xl border border-amber-600">
              <p className="text-amber-200 text-sm mb-2 font-medium">Save your mnemonic securely. It won't be shown again.</p>
              <p className="font-mono text-sm break-all bg-bg p-2 rounded-xl mb-2">{generatedWallet.mnemonic}</p>
              <p className="text-text-lo text-sm">Address: <span className="text-white font-mono">{generatedWallet.address}</span></p>
            </div>
            <input
              type="password"
              className="w-full bg-bg rounded-xl p-3 text-sm border border-mars-900/50 focus:border-mars-400 outline-none"
              placeholder="Password to encrypt mnemonic (optional)"
              value={keystorePassword}
              onChange={(e) => setKeystorePassword(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setMode('choose'); setGeneratedWallet(null); }}
                className="px-4 py-2 bg-bg-muted rounded-xl text-text-lo hover:text-text-hi transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveGenerated}
                disabled={saving}
                className="px-5 py-2 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'I saved it, continue'}
              </button>
            </div>
          </div>
        )}

        {mode === 'generate' && !generatedWallet && (
          <p className="text-text-lo">Generating wallet...</p>
        )}

        {mode === 'choose' && (
          <div className="flex items-center gap-3 pt-2">
            <label className="text-sm text-text-lo">Mining threads</label>
            <input
              type="number"
              min={1}
              max={16}
              value={threads}
              onChange={(e) => setThreads(parseInt(e.target.value, 10) || 1)}
              className="w-16 bg-bg-panel rounded-xl px-2 py-1 text-sm border border-mars-900/50 focus:border-mars-400 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
