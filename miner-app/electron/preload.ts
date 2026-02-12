import { contextBridge, ipcRenderer } from 'electron';

const geth = {
  isAvailable: (customPath?: string) => ipcRenderer.invoke('geth:isAvailable', customPath),
  download: () => ipcRenderer.invoke('geth:download'),
  getPath: () => ipcRenderer.invoke('geth:getPath'),
  onDownloadProgress: (callback: (p: { percent: number; downloadedBytes: number; totalBytes: number }) => void) => {
    const handler = (_: unknown, p: { percent: number; downloadedBytes: number; totalBytes: number }) => callback(p);
    ipcRenderer.on('geth:downloadProgress', handler);
    return () => ipcRenderer.removeListener('geth:downloadProgress', handler);
  },
};

const miner = {
  start: (minerIndex: number, config?: { minerThreads?: number; cacheMB?: number; etherbase?: string }) =>
    ipcRenderer.invoke('miner:start', minerIndex, config),
  stop: (minerIndex: number) => ipcRenderer.invoke('miner:stop', minerIndex),
  addTab: (config?: { minerThreads?: number; cacheMB?: number; etherbase?: string }) => ipcRenderer.invoke('miner:addTab', config),
  removeTab: (minerIndex: number) => ipcRenderer.invoke('miner:removeTab', minerIndex),
  getState: (minerIndex: number) => ipcRenderer.invoke('miner:getState', minerIndex),
  getTabIndices: () => ipcRenderer.invoke('miner:getTabIndices'),
  getRpcUrl: (minerIndex: number) => ipcRenderer.invoke('miner:getRpcUrl', minerIndex),
  onLog: (callback: (minerIndex: number, line: string, source: 'stdout' | 'stderr') => void) => {
    const handler = (_: unknown, minerIndex: number, line: string, source: 'stdout' | 'stderr') =>
      callback(minerIndex, line, source);
    ipcRenderer.on('miner:log', handler);
    return () => ipcRenderer.removeListener('miner:log', handler);
  },
  onState: (callback: (minerIndex: number, state: Record<string, unknown>) => void) => {
    const handler = (_: unknown, minerIndex: number, state: Record<string, unknown>) =>
      callback(minerIndex, state);
    ipcRenderer.on('miner:state', handler);
    return () => ipcRenderer.removeListener('miner:state', handler);
  },
};

const wallet = {
  generate: () => ipcRenderer.invoke('wallet:generate'),
  importMnemonic: (phrase: string) => ipcRenderer.invoke('wallet:importMnemonic', phrase),
  importPrivateKey: (key: string) => ipcRenderer.invoke('wallet:importPrivateKey', key),
  setAddressOnly: (address: string) => ipcRenderer.invoke('wallet:setAddressOnly', address),
  getStoredAddress: (minerIndex?: number) => ipcRenderer.invoke('wallet:getStoredAddress', minerIndex),
  getWalletInfo: (minerIndex?: number) => ipcRenderer.invoke('wallet:getWalletInfo', minerIndex),
  saveMnemonic: (mnemonic: string, password: string) => ipcRenderer.invoke('wallet:saveMnemonic', mnemonic, password),
  loadMnemonic: (password: string) => ipcRenderer.invoke('wallet:loadMnemonic', password),
  writeKeystoreToMiner: (minerIndex: number, privateKey: string, password: string) =>
    ipcRenderer.invoke('wallet:writeKeystoreToMiner', minerIndex, privateKey, password),
  isValidAddress: (address: string) => ipcRenderer.invoke('wallet:isValidAddress', address),
};

const network = {
  getBalance: (rpcUrl: string | null, address: string) => ipcRenderer.invoke('network:getBalance', rpcUrl, address),
  minerSetEtherbase: (rpcUrl: string, address: string) => ipcRenderer.invoke('network:minerSetEtherbase', rpcUrl, address),
  minerStart: (rpcUrl: string, threads: number) => ipcRenderer.invoke('network:minerStart', rpcUrl, threads),
  minerStop: (rpcUrl: string) => ipcRenderer.invoke('network:minerStop', rpcUrl),
  ethMining: (rpcUrl: string) => ipcRenderer.invoke('network:ethMining', rpcUrl),
  ethHashrate: (rpcUrl: string) => ipcRenderer.invoke('network:ethHashrate', rpcUrl),
  ethBlockNumber: (rpcUrl: string) => ipcRenderer.invoke('network:ethBlockNumber', rpcUrl),
  ethSyncing: (rpcUrl: string) => ipcRenderer.invoke('network:ethSyncing', rpcUrl),
  netPeerCount: (rpcUrl: string) => ipcRenderer.invoke('network:netPeerCount', rpcUrl),
  getRemoteRpcUrl: () => ipcRenderer.invoke('network:getRemoteRpcUrl'),
};

const config = {
  getHasCompletedOnboarding: () => ipcRenderer.invoke('config:getHasCompletedOnboarding'),
  setHasCompletedOnboarding: (value: boolean) => ipcRenderer.invoke('config:setHasCompletedOnboarding', value),
  getMinerTabs: () => ipcRenderer.invoke('config:getMinerTabs'),
  setMinerTabs: (tabs: Array<{ minerIndex: number; walletAddress?: string; minerThreads: number; cacheMB: number }>) =>
    ipcRenderer.invoke('config:setMinerTabs', tabs),
  getGethPath: () => ipcRenderer.invoke('config:getGethPath'),
  getGethVersion: () => ipcRenderer.invoke('config:getGethVersion'),
};

const platform = {
  getPlatformKey: () => ipcRenderer.invoke('platform:getPlatformKey'),
  getMarsCreditDir: () => ipcRenderer.invoke('platform:getMarsCreditDir'),
};

const appInfo = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
};

contextBridge.exposeInMainWorld('electronAPI', {
  geth,
  miner,
  wallet,
  network,
  config,
  platform,
  app: appInfo,
});
