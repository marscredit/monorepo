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
      <div className="min-h-screen bg-mars-black text-white flex items-center justify-center">
        <p>Electron API not available (run in Electron).</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mars-black text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-mars-red mb-2">Mars Credit Miner</h1>
      <p className="text-gray-400 text-sm mb-8">Setup wizard</p>

      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`px-3 py-1 rounded text-sm ${i === step ? 'bg-mars-red text-white' : 'bg-mars-dark text-gray-400'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div>
          <p className="text-gray-300 mb-4">
            Mine Mars Credit (MARS) on the Mars Credit network. This app will download Geth, let you set up a wallet, and start mining.
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-4 py-2 bg-mars-red rounded hover:bg-mars-accent"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 1: Geth Download */}
      {step === 1 && (
        <div>
          {gethStatus === 'checking' && <p>Checking for Geth...</p>}
          {gethStatus === 'missing' && (
            <>
              <p className="text-gray-300 mb-4">Geth is required to mine. Download it now (about 30MB).</p>
              <button
                type="button"
                onClick={handleDownloadGeth}
                className="px-4 py-2 bg-mars-red rounded hover:bg-mars-accent"
              >
                Download Geth
              </button>
            </>
          )}
          {gethStatus === 'downloading' && (
            <div>
              <p className="mb-2">Downloading...</p>
              <div className="h-2 bg-mars-dark rounded overflow-hidden">
                <div className="h-full bg-mars-red transition-all" style={{ width: `${downloadProgress}%` }} />
              </div>
            </div>
          )}
          {gethStatus === 'done' && (
            <>
              <p className="text-green-400 mb-4">Geth is ready.</p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-mars-red rounded hover:bg-mars-accent"
              >
                Next
              </button>
            </>
          )}
          {gethStatus === 'error' && (
            <button type="button" onClick={handleDownloadGeth} className="px-4 py-2 bg-mars-red rounded">
              Retry download
            </button>
          )}
        </div>
      )}

      {/* Step 2: Wallet */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-gray-300">Choose how to set up your mining wallet.</p>

          {!walletChoice && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateWallet}
                className="p-3 bg-mars-dark rounded border border-gray-600 text-left hover:border-mars-red"
              >
                Generate new wallet
              </button>
              <div className="p-3 bg-mars-dark rounded border border-gray-600">
                <p className="text-sm text-gray-400 mb-2">Import from mnemonic</p>
                <textarea
                  className="w-full bg-black rounded p-2 text-sm font-mono"
                  rows={3}
                  placeholder="twelve word mnemonic phrase..."
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full mt-2 bg-black rounded p-2 text-sm"
                  placeholder="Keystore password (optional)"
                  value={keystorePassword}
                  onChange={(e) => setKeystorePassword(e.target.value)}
                />
                <button type="button" onClick={handleImportMnemonic} className="mt-2 px-3 py-1 bg-mars-red rounded text-sm">
                  Import
                </button>
              </div>
              <div className="p-3 bg-mars-dark rounded border border-gray-600">
                <p className="text-sm text-gray-400 mb-2">Import from private key</p>
                <input
                  type="password"
                  className="w-full bg-black rounded p-2 text-sm font-mono"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full mt-2 bg-black rounded p-2 text-sm"
                  placeholder="Keystore password (optional)"
                  value={keystorePassword}
                  onChange={(e) => setKeystorePassword(e.target.value)}
                />
                <button type="button" onClick={handleImportPrivateKey} className="mt-2 px-3 py-1 bg-mars-red rounded text-sm">
                  Import
                </button>
              </div>
              <div className="p-3 bg-mars-dark rounded border border-gray-600">
                <p className="text-sm text-gray-400 mb-2">Use address only (no keys stored)</p>
                <input
                  className="w-full bg-black rounded p-2 text-sm font-mono"
                  placeholder="0x..."
                  value={addressOnly}
                  onChange={(e) => setAddressOnly(e.target.value)}
                />
                <button type="button" onClick={handleAddressOnly} className="mt-2 px-3 py-1 bg-mars-red rounded text-sm">
                  Use this address
                </button>
              </div>
            </div>
          )}

          {generatedWallet && (
            <div className="p-4 bg-mars-dark rounded border border-amber-600">
              <p className="text-amber-200 text-sm mb-2">Save your mnemonic securely. It won’t be shown again.</p>
              <p className="font-mono text-sm break-all bg-black p-2 rounded mb-2">{generatedWallet.mnemonic}</p>
              <p className="text-gray-400 text-sm">Address: {generatedWallet.address}</p>
              <input
                type="password"
                className="w-full mt-2 bg-black rounded p-2 text-sm"
                placeholder="Password to encrypt mnemonic (optional)"
                value={keystorePassword}
                onChange={(e) => setKeystorePassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSaveGeneratedAndContinue}
                className="mt-3 px-4 py-2 bg-mars-red rounded"
              >
                I saved it, continue
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Miner Config */}
      {step === 3 && (
        <div>
          <p className="text-gray-300 mb-4">Mining threads (default 1). Increase if you have more CPU cores.</p>
          <input
            type="number"
            min={1}
            max={16}
            value={minerThreads}
            onChange={(e) => setMinerThreads(parseInt(e.target.value, 10) || 1)}
            className="bg-mars-dark rounded px-3 py-2 w-20"
          />
          <button
            type="button"
            onClick={() => setStep(4)}
            className="ml-4 px-4 py-2 bg-mars-red rounded hover:bg-mars-accent"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 4: Ready */}
      {step === 4 && (
        <div>
          <p className="text-gray-300 mb-4">You’re all set. Click below to open the miner dashboard and start mining.</p>
          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-2 bg-mars-red rounded hover:bg-mars-accent"
          >
            Go to Miner
          </button>
        </div>
      )}
    </div>
  );
}
