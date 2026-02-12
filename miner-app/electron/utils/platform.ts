/**
 * Platform detection for Geth binary selection and paths.
 * Supports: darwin-arm64, darwin-x64, win32-x64 (Windows phase 2).
 */

export type PlatformKey = 'darwin-arm64' | 'darwin-x64' | 'win32-x64' | 'win32-arm64' | 'linux-x64' | 'linux-arm64';

export function getPlatformKey(): PlatformKey {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  }
  if (platform === 'win32') {
    return arch === 'arm64' ? 'win32-arm64' : 'win32-x64';
  }
  if (platform === 'linux') {
    return arch === 'arm64' ? 'linux-arm64' : 'linux-x64';
  }
  return process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
}

export function isMac(): boolean {
  return process.platform === 'darwin';
}

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function getGethBinaryName(): string {
  return isWindows() ? 'geth.exe' : 'geth';
}
