import { useState, useEffect } from 'react';

const STEPS = ['Welcome', 'Geth Download', 'Wallet', 'Miner Config', 'Ready'];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [gethStatus, setGethStatus] = useState<'checking' | 'missing' | 'downloading' | 'done' | 'error'>('checking');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [walletChoice, setWalletChoice] = useState<'generate' | 'import_mnemonic' | 'import_key' | 'address_only' | null>(null);
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [addressOnly, setAddressOnly] = useState('');
  const [keystorePassword, setKeystorePassword] = useState('');
  const [minerThreads, setMinerThreads] = useState(1);
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; mnemonic: string; privateKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const api = window.electronAPI;

  useEffect(() => {
    if (!api) return;
    const check = async () => {
      const r = await api.geth.isAvailable();
      setGethStatus(r.ok ? 'done' : 'missing');
    };
    check();
  }, [api]);

  const handleDownloadGeth = async () => {
    if (!api) return;
    setGethStatus('downloading');
    setError(null);
    const unsub = api.geth.onDownloadProgress((p) => setDownloadProgress(p.percent));
    try {
      await api.geth.download();
      setGethStatus('done');
      unsub();
    } catch (e) {
      setError((e as Error).message);
      setGethStatus('error');
      unsub();
    }
  };

  const handleGenerateWallet = async () => {
    if (!api) return;
    setError(null);
    try {
      const w = await api.wallet.generate();
      setGeneratedWallet(w);
      setWalletChoice('generate');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleImportMnemonic = async () => {
    if (!api || !mnemonic.trim()) return;
    setError(null);
    try {
      const { address, privateKey: pk } = await api.wallet.importMnemonic(mnemonic.trim());
      await api.wallet.writeKeystoreToMiner(1, pk, keystorePassword || 'mars');
      await api.wallet.setAddressOnly(address);
      setWalletChoice('import_mnemonic');
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleImportPrivateKey = async () => {
    if (!api || !privateKey.trim()) return;
    setError(null);
    try {
      const { address } = await api.wallet.importPrivateKey(privateKey.trim());
      await api.wallet.writeKeystoreToMiner(1, privateKey.trim(), keystorePassword || 'mars');
      await api.wallet.setAddressOnly(address);
      setWalletChoice('import_key');
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleAddressOnly = async () => {
    if (!api || !addressOnly.trim()) return;
    setError(null);
    const valid = await api.wallet.isValidAddress(addressOnly.trim());
    if (!valid) {
      setError('Invalid Ethereum address');
      return;
    }
    await api.wallet.setAddressOnly(addressOnly.trim());
    setStep(3);
  };

  const handleSaveGeneratedAndContinue = async () => {
    if (!api || !generatedWallet) return;
    setError(null);
    try {
      await api.wallet.writeKeystoreToMiner(1, generatedWallet.privateKey, keystorePassword || 'mars');
      await api.wallet.setAddressOnly(generatedWallet.address);
      if (keystorePassword) await api.wallet.saveMnemonic(generatedWallet.mnemonic, keystorePassword);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleFinish = async () => {
    if (!api) return;
    await api.config.setHasCompletedOnboarding(true);
    onComplete();
  };

  if (!api) {
    return (
      <div className="h-screen bg-bg text-white flex items-center justify-center">
        <p>Electron API not available (run in Electron).</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg text-white p-8 max-w-2xl mx-auto overflow-y-auto">
      <h1 className="text-2xl font-bold text-mars-400 mb-2">Mars Credit Miner</h1>
      <p className="text-text-lo text-sm mb-8">Setup wizard</p>

      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
              i === step ? 'bg-mars-400 text-white' : 'bg-bg-panel text-text-lo'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {step === 0 && (
        <div>
          <p className="text-text-med mb-4">
            Mine Mars Credit (MARS) on the Mars Credit network. This app will download Geth, let you set up a wallet, and start mining.
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
          >
            Next
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          {gethStatus === 'checking' && <p>Checking for Geth...</p>}
          {gethStatus === 'missing' && (
            <>
              <p className="text-text-med mb-4">Geth is required to mine. Download it now (about 30MB).</p>
              <button
                type="button"
                onClick={handleDownloadGeth}
                className="px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
              >
                Download Geth
              </button>
            </>
          )}
          {gethStatus === 'downloading' && (
            <div>
              <p className="mb-2">Downloading...</p>
              <div className="h-2 bg-bg-panel rounded-xl overflow-hidden">
                <div className="h-full bg-mars-400 transition-all" style={{ width: `${downloadProgress}%` }} />
              </div>
            </div>
          )}
          {gethStatus === 'done' && (
            <>
              <p className="text-green-400 mb-4">Geth is ready.</p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
              >
                Next
              </button>
            </>
          )}
          {gethStatus === 'error' && (
            <button
              type="button"
              onClick={handleDownloadGeth}
              className="px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all"
            >
              Retry download
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-text-med">Choose how to set up your mining wallet.</p>

          {!walletChoice && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateWallet}
                className="p-3 bg-bg-panel rounded-xl border border-mars-900/50 text-left hover:border-mars-400 transition-colors"
              >
                Generate new wallet
              </button>
              <div className="p-3 bg-bg-panel rounded-xl border border-mars-900/50">
                <p className="text-sm text-text-lo mb-2">Import from mnemonic</p>
                <textarea
                  className="w-full bg-bg rounded-xl p-2 text-sm font-mono border border-mars-900/50 focus:border-mars-400 outline-none"
                  rows={3}
                  placeholder="twelve word mnemonic phrase..."
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full mt-2 bg-bg rounded-xl p-2 text-sm border border-mars-900/50 focus:border-mars-400 outline-none"
                  placeholder="Keystore password (optional)"
                  value={keystorePassword}
                  onChange={(e) => setKeystorePassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleImportMnemonic}
                  className="mt-2 px-4 py-1.5 bg-mars-400 rounded-xl text-sm font-semibold hover:bg-mars-300 transition-all"
                >
                  Import
                </button>
              </div>
              <div className="p-3 bg-bg-panel rounded-xl border border-mars-900/50">
                <p className="text-sm text-text-lo mb-2">Import from private key</p>
                <input
                  type="password"
                  className="w-full bg-bg rounded-xl p-2 text-sm font-mono border border-mars-900/50 focus:border-mars-400 outline-none"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full mt-2 bg-bg rounded-xl p-2 text-sm border border-mars-900/50 focus:border-mars-400 outline-none"
                  placeholder="Keystore password (optional)"
                  value={keystorePassword}
                  onChange={(e) => setKeystorePassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleImportPrivateKey}
                  className="mt-2 px-4 py-1.5 bg-mars-400 rounded-xl text-sm font-semibold hover:bg-mars-300 transition-all"
                >
                  Import
                </button>
              </div>
              <div className="p-3 bg-bg-panel rounded-xl border border-mars-900/50">
                <p className="text-sm text-text-lo mb-2">Use address only (no keys stored)</p>
                <input
                  className="w-full bg-bg rounded-xl p-2 text-sm font-mono border border-mars-900/50 focus:border-mars-400 outline-none"
                  placeholder="0x..."
                  value={addressOnly}
                  onChange={(e) => setAddressOnly(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddressOnly}
                  className="mt-2 px-4 py-1.5 bg-mars-400 rounded-xl text-sm font-semibold hover:bg-mars-300 transition-all"
                >
                  Use this address
                </button>
              </div>
            </div>
          )}

          {generatedWallet && (
            <div className="p-4 bg-bg-panel rounded-xl border border-amber-600">
              <p className="text-amber-200 text-sm mb-2">Save your mnemonic securely. It won't be shown again.</p>
              <p className="font-mono text-sm break-all bg-bg p-2 rounded-xl mb-2">{generatedWallet.mnemonic}</p>
              <p className="text-text-lo text-sm">Address: {generatedWallet.address}</p>
              <input
                type="password"
                className="w-full mt-2 bg-bg rounded-xl p-2 text-sm border border-mars-900/50 focus:border-mars-400 outline-none"
                placeholder="Password to encrypt mnemonic (optional)"
                value={keystorePassword}
                onChange={(e) => setKeystorePassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSaveGeneratedAndContinue}
                className="mt-3 px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
              >
                I saved it, continue
              </button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="text-text-med mb-4">Mining threads (default 1). Increase if you have more CPU cores.</p>
          <input
            type="number"
            min={1}
            max={16}
            value={minerThreads}
            onChange={(e) => setMinerThreads(parseInt(e.target.value, 10) || 1)}
            className="bg-bg-panel rounded-xl px-3 py-2 w-20 border border-mars-900/50 focus:border-mars-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setStep(4)}
            className="ml-4 px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
          >
            Next
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <p className="text-text-med mb-4">You're all set. Click below to open the miner dashboard and start mining.</p>
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2.5 bg-mars-400 rounded-xl font-semibold hover:bg-mars-300 transition-all shadow-[0_4px_20px_rgba(204,0,0,0.3)]"
          >
            Go to Miner
          </button>
        </div>
      )}
    </div>
  );
}
