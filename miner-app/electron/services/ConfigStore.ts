/**
 * ConfigStore: Persisted settings via electron-store.
 */

import Store from 'electron-store';

export interface MinerTabConfig {
  minerIndex: number;
  walletAddress?: string;
  minerThreads: number;
  cacheMB: number;
}

export interface AppConfig {
  hasCompletedOnboarding: boolean;
  minerTabs: MinerTabConfig[];
  gethBinaryPath?: string;
  gethVersion?: string;
  windowBounds?: { x: number; y: number; width: number; height: number };
  theme?: 'dark' | 'light';
}

const store = new Store<AppConfig>({
  name: 'mars-credit-miner',
  defaults: {
    hasCompletedOnboarding: false,
    minerTabs: [],
    theme: 'dark',
  },
});

export function getHasCompletedOnboarding(): boolean {
  return store.get('hasCompletedOnboarding', false);
}

export function setHasCompletedOnboarding(value: boolean): void {
  store.set('hasCompletedOnboarding', value);
}

export function getMinerTabs(): MinerTabConfig[] {
  return store.get('minerTabs', []);
}

export function setMinerTabs(tabs: MinerTabConfig[]): void {
  store.set('minerTabs', tabs);
}

export function getGethPath(): string | undefined {
  return store.get('gethBinaryPath');
}

export function setGethPath(path: string): void {
  store.set('gethBinaryPath', path);
}

export function getGethVersion(): string | undefined {
  return store.get('gethVersion');
}

export function setGethVersion(version: string): void {
  store.set('gethVersion', version);
}

export function getWindowBounds(): AppConfig['windowBounds'] {
  return store.get('windowBounds');
}

export function setWindowBounds(bounds: AppConfig['windowBounds']): void {
  store.set('windowBounds', bounds);
}

export function getMinerTabConfig(minerIndex: number): MinerTabConfig | undefined {
  const tabs = getMinerTabs();
  return tabs.find((t) => t.minerIndex === minerIndex);
}

export function upsertMinerTab(config: Partial<MinerTabConfig> & { minerIndex: number }): void {
  const tabs = getMinerTabs();
  const idx = tabs.findIndex((t) => t.minerIndex === config.minerIndex);
  if (idx >= 0) {
    tabs[idx] = { ...tabs[idx], ...config };
  } else {
    tabs.push({ minerThreads: 1, cacheMB: 4096, ...config });
  }
  setMinerTabs(tabs);
}

export function setMinerTabWalletAddress(minerIndex: number, address: string): void {
  upsertMinerTab({ minerIndex, walletAddress: address });
}

export function removeMinerTab(minerIndex: number): void {
  const tabs = getMinerTabs().filter((t) => t.minerIndex !== minerIndex);
  setMinerTabs(tabs);
}

export function getTheme(): 'dark' | 'light' {
  return store.get('theme', 'dark');
}

export function setTheme(theme: 'dark' | 'light'): void {
  store.set('theme', theme);
}

export { store };
