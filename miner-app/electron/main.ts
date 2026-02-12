import { app, BrowserWindow, ipcMain, powerMonitor } from 'electron';
import path from 'path';
import {
  isGethAvailable,
  downloadGeth,
  getGethPath as getGethPathUtil,
  type GethDownloadProgress,
} from './services/GethManager';
import { minerService } from './services/MinerService';
import * as WalletService from './services/WalletService';
import * as NetworkService from './services/NetworkService';
import * as ConfigStore from './services/ConfigStore';
import { getPlatformKey } from './utils/platform';
import { getMarsCreditDir } from './utils/paths';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const bounds = ConfigStore.getWindowBounds();
  mainWindow = new BrowserWindow({
    width: bounds?.width ?? 1200,
    height: bounds?.height ?? 800,
    x: bounds?.x,
    y: bounds?.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('resize', () => {
    const b = mainWindow?.getBounds();
    if (b) ConfigStore.setWindowBounds(b);
  });
  mainWindow.on('move', () => {
    const b = mainWindow?.getBounds();
    if (b) ConfigStore.setWindowBounds(b);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    minerService.stopAll();
  });
}

function registerIpc() {
  const send = (channel: string, ...args: unknown[]) => {
    mainWindow?.webContents?.send(channel, ...args);
  };

  minerService.on('minerLog', (minerIndex, line, source) => {
    send('miner:log', minerIndex, line, source);
  });
  minerService.on('minerState', (minerIndex, state) => {
    send('miner:state', minerIndex, state);
  });

  ipcMain.handle('geth:isAvailable', async (_, customPath?: string) => {
    return isGethAvailable(customPath);
  });

  ipcMain.handle('geth:download', async () => {
    const result = await downloadGeth((p: GethDownloadProgress) => {
      send('geth:downloadProgress', p);
    });
    minerService.setGethPath(result.path);
    ConfigStore.setGethPath(result.path);
    ConfigStore.setGethVersion(result.version);
    return result;
  });

  ipcMain.handle('geth:getPath', () => getGethPathUtil());

  ipcMain.handle('miner:start', async (_, minerIndex: number, config?: { minerThreads?: number; cacheMB?: number; etherbase?: string }) => {
    const gethPath = ConfigStore.getGethPath() || getGethPathUtil();
    minerService.setGethPath(gethPath);
    await minerService.startMiner(minerIndex, config);
    return minerService.getMinerState(minerIndex);
  });

  ipcMain.handle('miner:stop', (_, minerIndex: number) => {
    minerService.stopMiner(minerIndex);
  });

  ipcMain.handle('miner:addTab', (_, config?) => {
    return minerService.addTab(config);
  });

  ipcMain.handle('miner:removeTab', (_, minerIndex: number) => {
    minerService.removeTab(minerIndex);
  });

  ipcMain.handle('miner:getState', (_, minerIndex: number) => {
    return minerService.getMinerState(minerIndex);
  });

  ipcMain.handle('miner:getTabIndices', () => {
    return minerService.getTabIndices();
  });

  ipcMain.handle('miner:getRpcUrl', (_, minerIndex: number) => {
    return minerService.getRpcUrl(minerIndex);
  });

  ipcMain.handle('wallet:generate', () => WalletService.generateWallet());
  ipcMain.handle('wallet:importMnemonic', (_, phrase: string) => WalletService.importFromMnemonic(phrase));
  ipcMain.handle('wallet:importPrivateKey', (_, key: string) => WalletService.importFromPrivateKey(key));
  ipcMain.handle('wallet:setAddressOnly', (_, address: string) => WalletService.setAddressOnly(address));
  ipcMain.handle('wallet:getStoredAddress', (_, minerIndex?: number) => WalletService.getStoredMiningAddress(minerIndex));
  ipcMain.handle('wallet:getWalletInfo', (_, minerIndex?: number) => WalletService.getWalletInfo(minerIndex));
  ipcMain.handle('wallet:saveMnemonic', (_, mnemonic: string, password: string) => WalletService.saveMnemonic(mnemonic, password));
  ipcMain.handle('wallet:loadMnemonic', (_, password: string) => WalletService.loadMnemonic(password));
  ipcMain.handle('wallet:writeKeystoreToMiner', (_, minerIndex: number, privateKey: string, password: string) =>
    WalletService.writeKeystoreToMiner(minerIndex, privateKey, password)
  );
  ipcMain.handle('wallet:isValidAddress', (_, address: string) => WalletService.isValidAddress(address));

  ipcMain.handle('network:getBalance', async (_, rpcUrl: string | null, address: string) => {
    const wei = await NetworkService.getBalancePreferLocal(rpcUrl, address);
    return { wei, mars: NetworkService.weiToMars(wei) };
  });
  ipcMain.handle('network:minerSetEtherbase', (_, rpcUrl: string, address: string) =>
    NetworkService.minerSetEtherbase(rpcUrl, address)
  );
  ipcMain.handle('network:minerStart', (_, rpcUrl: string, threads: number) =>
    NetworkService.minerStart(rpcUrl, threads)
  );
  ipcMain.handle('network:minerStop', (_, rpcUrl: string) => NetworkService.minerStop(rpcUrl));
  ipcMain.handle('network:ethMining', (_, rpcUrl: string) => NetworkService.ethMining(rpcUrl));
  ipcMain.handle('network:ethHashrate', (_, rpcUrl: string) => NetworkService.ethHashrate(rpcUrl));
  ipcMain.handle('network:ethBlockNumber', (_, rpcUrl: string) => NetworkService.ethBlockNumber(rpcUrl));
  ipcMain.handle('network:ethSyncing', (_, rpcUrl: string) => NetworkService.ethSyncing(rpcUrl));
  ipcMain.handle('network:netPeerCount', (_, rpcUrl: string) => NetworkService.netPeerCount(rpcUrl));
  ipcMain.handle('network:getRemoteRpcUrl', () => NetworkService.getRemoteRpcUrl());

  ipcMain.handle('config:getHasCompletedOnboarding', () => ConfigStore.getHasCompletedOnboarding());
  ipcMain.handle('config:setHasCompletedOnboarding', (_, value: boolean) => ConfigStore.setHasCompletedOnboarding(value));
  ipcMain.handle('config:getMinerTabs', () => ConfigStore.getMinerTabs());
  ipcMain.handle('config:setMinerTabs', (_, tabs: ConfigStore.MinerTabConfig[]) => ConfigStore.setMinerTabs(tabs));
  ipcMain.handle('config:getGethPath', () => ConfigStore.getGethPath());
  ipcMain.handle('config:getGethVersion', () => ConfigStore.getGethVersion());

  ipcMain.handle('platform:getPlatformKey', () => getPlatformKey());
  ipcMain.handle('platform:getMarsCreditDir', () => getMarsCreditDir());
  ipcMain.handle('app:getVersion', () => app.getVersion());
}

let runningBeforeSleep: number[] = [];

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  if (process.platform === 'darwin') {
    powerMonitor.on('suspend', () => {
      runningBeforeSleep = minerService.getRunningMinerIndices();
      minerService.stopAll();
    });
    powerMonitor.on('resume', () => {
      for (const idx of runningBeforeSleep) {
        minerService.startMiner(idx).catch(() => {});
      }
      runningBeforeSleep = [];
    });
  }
});

app.on('window-all-closed', () => {
  minerService.stopAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
