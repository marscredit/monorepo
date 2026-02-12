/**
 * Platform-specific data directories for Mars Credit miner.
 * Base: ~/.marscredit (USERPROFILE\.marscredit on Windows).
 */

import * as path from 'path';
import * as os from 'os';

const MARS_DIR_NAME = '.marscredit';

function getHomeDir(): string {
  return os.homedir();
}

export function getMarsCreditDir(): string {
  return path.join(getHomeDir(), MARS_DIR_NAME);
}

export function getBinDir(): string {
  return path.join(getMarsCreditDir(), 'bin');
}

export function getGethBinaryPath(): string {
  const binDir = getBinDir();
  return path.join(binDir, process.platform === 'win32' ? 'geth.exe' : 'geth');
}

/** Data directory for a single miner instance (tab). Index is 1-based. */
export function getMinerDataDir(minerIndex: number): string {
  return path.join(getMarsCreditDir(), 'miners', String(minerIndex));
}

export function getMinerKeystoreDir(minerIndex: number): string {
  return path.join(getMinerDataDir(minerIndex), 'keystore');
}

export function getMinerLogsDir(minerIndex: number): string {
  return path.join(getMinerDataDir(minerIndex), 'logs');
}

export function getMinerPidPath(minerIndex: number): string {
  return path.join(getMinerDataDir(minerIndex), 'geth.pid');
}

export function getWalletEncPath(): string {
  return path.join(getMarsCreditDir(), 'wallet.enc');
}

export function getLogsDir(): string {
  return path.join(getMarsCreditDir(), 'logs');
}
