export interface GethDownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
}

export interface ElectronAPI {
  geth: {
    isAvailable: (customPath?: string) => Promise<{ ok: boolean; path: string; version?: string }>;
    download: () => Promise<{ path: string; version: string }>;
    getPath: () => Promise<string>;
    onDownloadProgress: (callback: (p: GethDownloadProgress) => void) => () => void;
  };
  miner: {
    start: (minerIndex: number, config?: { minerThreads?: number; cacheMB?: number; etherbase?: string }) => Promise<unknown>;
    stop: (minerIndex: number) => Promise<void>;
    addTab: (config?: { minerThreads?: number; cacheMB?: number; etherbase?: string }) => Promise<number>;
    removeTab: (minerIndex: number) => Promise<void>;
    getState: (minerIndex: number) => Promise<unknown>;
    getTabIndices: () => Promise<number[]>;
    getRpcUrl: (minerIndex: number) => Promise<string | null>;
    onLog: (callback: (minerIndex: number, line: string, source: 'stdout' | 'stderr') => void) => () => void;
    onState: (callback: (minerIndex: number, state: Record<string, unknown>) => void) => () => void;
  };
  wallet: {
    generate: () => Promise<{ address: string; mnemonic: string; privateKey: string }>;
    importMnemonic: (phrase: string) => Promise<{ address: string; privateKey: string }>;
    importPrivateKey: (key: string) => Promise<{ address: string }>;
    setAddressOnly: (address: string) => Promise<void>;
    getStoredAddress: (minerIndex?: number) => Promise<string | null>;
    getWalletInfo: (minerIndex?: number) => Promise<{ address: string; mode: string; hasMnemonic: boolean; hasPrivateKey: boolean } | null>;
    saveMnemonic: (mnemonic: string, password: string) => Promise<void>;
    loadMnemonic: (password: string) => Promise<string | null>;
    writeKeystoreToMiner: (minerIndex: number, privateKey: string, password: string) => Promise<string>;
    isValidAddress: (address: string) => Promise<boolean>;
  };
  network: {
    getBalance: (rpcUrl: string | null, address: string) => Promise<{ wei: string; mars: string }>;
    minerSetEtherbase: (rpcUrl: string, address: string) => Promise<boolean>;
    minerStart: (rpcUrl: string, threads: number) => Promise<void>;
    minerStop: (rpcUrl: string) => Promise<void>;
    ethMining: (rpcUrl: string) => Promise<boolean>;
    ethHashrate: (rpcUrl: string) => Promise<string>;
    ethBlockNumber: (rpcUrl: string) => Promise<string>;
    ethSyncing: (rpcUrl: string) => Promise<false | { currentBlock: string; highestBlock: string }>;
    netPeerCount: (rpcUrl: string) => Promise<string>;
    getRemoteRpcUrl: () => Promise<string>;
  };
  config: {
    getHasCompletedOnboarding: () => Promise<boolean>;
    setHasCompletedOnboarding: (value: boolean) => Promise<void>;
    getMinerTabs: () => Promise<Array<{ minerIndex: number; walletAddress?: string; minerThreads: number; cacheMB: number }>>;
    setMinerTabs: (tabs: Array<{ minerIndex: number; walletAddress?: string; minerThreads: number; cacheMB: number }>) => Promise<void>;
    getGethPath: () => Promise<string | undefined>;
    getGethVersion: () => Promise<string | undefined>;
  };
  platform: {
    getPlatformKey: () => Promise<string>;
    getMarsCreditDir: () => Promise<string>;
  };
  app: {
    getVersion: () => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
