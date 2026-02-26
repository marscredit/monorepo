/**
 * GethManager: Download, verify, and manage Geth binary per platform.
 * Linux/Windows: downloads from official gethstore.
 * macOS: uses bundled pre-merge binary from miner-apple-silicon (v1.10.18, ethash PoW).
 * Post-merge Geth (v1.13+) removed --mine/--miner.threads and cannot mine Mars Credit.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { execSync, spawn } from 'child_process';
import { app } from 'electron';
import { getPlatformKey, isMac, type PlatformKey } from '../utils/platform';
import { getBinDir, getGethBinaryPath } from '../utils/paths';
import { logger } from '../utils/logger';

const GETH_VERSION = '1.16.8';
const GETH_COMMIT = 'abeb78c6';
const BASE_URL = 'https://gethstore.blob.core.windows.net/builds';

const PLATFORM_ARCHIVES: Partial<Record<PlatformKey, string>> = {
  'win32-x64': `geth-windows-amd64-${GETH_VERSION}-${GETH_COMMIT}.zip`,
  'win32-arm64': `geth-windows-arm64-${GETH_VERSION}-${GETH_COMMIT}.zip`,
  'linux-x64': `geth-linux-amd64-${GETH_VERSION}-${GETH_COMMIT}.tar.gz`,
  'linux-arm64': `geth-linux-arm64-${GETH_VERSION}-${GETH_COMMIT}.tar.gz`,
};

export interface GethDownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
}

export interface GethManagerResult {
  path: string;
  version: string;
}

function getArchiveUrl(platformKey: PlatformKey): string | null {
  const name = PLATFORM_ARCHIVES[platformKey];
  if (!name) return null;
  return `${BASE_URL}/${name}`;
}

/** Check if a geth binary supports ethash PoW mining (--mine and --miner.threads). Post-merge geth removed these. */
export function supportsPoWMining(binaryPath: string): boolean {
  try {
    const help = execSync(`"${binaryPath}" --help`, { encoding: 'utf8', timeout: 10_000, stdio: 'pipe' });
    return help.includes('--mine') && help.includes('miner.threads');
  } catch {
    return false;
  }
}

function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (p: GethDownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const redirect = res.headers.location;
          if (redirect) {
            file.close();
            fs.unlinkSync(destPath);
            downloadFile(redirect, destPath, onProgress).then(resolve).catch(reject);
            return;
          }
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          if (onProgress && total > 0) {
            onProgress({
              percent: Math.min(100, (downloaded / total) * 100),
              downloadedBytes: downloaded,
              totalBytes: total,
            });
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

function findGethInDir(dir: string, binaryName: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === binaryName) return full;
    if (e.isDirectory()) {
      const found = findGethInDir(full, binaryName);
      if (found) return found;
    }
  }
  return null;
}

function extractTarGz(archivePath: string, outDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      fs.mkdirSync(outDir, { recursive: true });
      execSync(`tar -xzf "${archivePath}" -C "${outDir}"`, { stdio: 'pipe' });
      const binaryName = process.platform === 'win32' ? 'geth.exe' : 'geth';
      const found = findGethInDir(outDir, binaryName);
      if (found) resolve(found);
      else reject(new Error(`${binaryName} not found in tarball`));
    } catch (e) {
      reject(e);
    }
  });
}

function extractZip(archivePath: string, outDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(outDir, true);
      const found = findGethInDir(outDir, 'geth.exe');
      if (found) resolve(found);
      else reject(new Error('geth.exe not found in zip'));
    } catch (e) {
      reject(e);
    }
  });
}

function ensureBinDir(): string {
  const binDir = getBinDir();
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  return binDir;
}

export function getGethVersion(binaryPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, ['version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    proc.stdout?.on('data', (d: Buffer) => { out += d.toString(); });
    proc.stderr?.on('data', (d: Buffer) => { out += d.toString(); });
    proc.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(out || `geth version exited ${code}`));
        return;
      }
      const match = out.match(/Version: (\d+\.\d+\.\d+)/);
      resolve(match ? match[1] : out.trim());
    });
    proc.on('error', reject);
  });
}

const SYSTEM_GETH_PATHS = [
  '/opt/homebrew/bin/geth',
  '/usr/local/bin/geth',
  '/usr/bin/geth',
];

/** Find geth on system PATH that supports PoW mining. Returns path or null. */
function findSystemGeth(): string | null {
  const candidates: string[] = [];
  for (const p of SYSTEM_GETH_PATHS) {
    if (fs.existsSync(p)) candidates.push(p);
  }
  try {
    const which = execSync('which geth', { stdio: 'pipe', encoding: 'utf8' }).trim();
    if (which && fs.existsSync(which) && !candidates.includes(which)) {
      candidates.push(which);
    }
  } catch { /* not on PATH */ }

  for (const p of candidates) {
    if (supportsPoWMining(p)) {
      logger.info('Found PoW-compatible system geth', { path: p });
      return p;
    }
    logger.info('System geth does not support PoW mining, skipping', { path: p });
  }
  return null;
}

/** Check if Geth binary exists, is runnable, AND supports PoW mining. */
export async function isGethAvailable(customPath?: string): Promise<{ ok: boolean; path: string; version?: string }> {
  const binPath = customPath || getGethBinaryPath();
  if (fs.existsSync(binPath) && supportsPoWMining(binPath)) {
    try {
      const version = await getGethVersion(binPath);
      return { ok: true, path: binPath, version };
    } catch { /* corrupt binary */ }
  }
  const systemPath = findSystemGeth();
  if (systemPath) {
    try {
      const version = await getGethVersion(systemPath);
      return { ok: true, path: systemPath, version };
    } catch { /* found but not runnable */ }
  }
  return { ok: false, path: binPath };
}

/**
 * Find the bundled geth binary from miner-apple-silicon (pre-merge, PoW-capable).
 * __dirname at runtime is dist-electron/services/, so we go up to the monorepo root.
 */
function findBundledGeth(): string | null {
  const candidates: string[] = [];

  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'geth', 'geth'));
  }

  // In dev: dist-electron/services/ -> dist-electron/ -> miner-app/ -> monorepo/
  const monorepoRoot = path.resolve(__dirname, '..', '..', '..');
  candidates.push(
    path.join(monorepoRoot, 'miner-apple-silicon', 'Resources', 'geth', 'geth'),
    path.join(monorepoRoot, 'miner-apple-silicon', 'builds', 'build29',
      'Mars Credit Miner.app', 'Contents', 'Resources', 'geth', 'geth'),
  );

  // Also try from app.getAppPath() which points to the project root in dev
  try {
    const appRoot = app.getAppPath();
    candidates.push(
      path.join(appRoot, '..', 'miner-apple-silicon', 'Resources', 'geth', 'geth'),
    );
  } catch { /* app not ready yet */ }

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      logger.info('Found bundled geth', { path: p });
      return p;
    }
  }

  logger.warn('No bundled geth found', { searched: candidates });
  return null;
}

/** Copy a geth binary to our bin dir after verifying it supports PoW. */
async function installFromPath(
  sourcePath: string,
  finalPath: string,
  onProgress?: (p: GethDownloadProgress) => void,
  label?: string,
): Promise<GethManagerResult> {
  fs.copyFileSync(sourcePath, finalPath);
  fs.chmodSync(finalPath, 0o755);

  if (!supportsPoWMining(finalPath)) {
    fs.unlinkSync(finalPath);
    throw new Error(`${label || sourcePath} does not support PoW mining (post-merge geth)`);
  }

  const version = await getGethVersion(finalPath);
  onProgress?.({ percent: 100, downloadedBytes: 0, totalBytes: 0 });
  logger.info(`Geth installed from ${label || 'source'}`, { path: finalPath, version });
  return { path: finalPath, version };
}

/** Download / install Geth for current platform. */
export async function downloadGeth(
  onProgress?: (p: GethDownloadProgress) => void
): Promise<GethManagerResult> {
  const platformKey = getPlatformKey();
  ensureBinDir();
  const finalPath = getGethBinaryPath();

  // ── macOS: bundled binary first (known PoW-compatible), then system PATH ──
  if (isMac()) {
    onProgress?.({ percent: 5, downloadedBytes: 0, totalBytes: 0 });

    // Strategy 1: Bundled binary from miner-apple-silicon (v1.10.18, ethash PoW)
    const bundled = findBundledGeth();
    if (bundled) {
      try {
        return await installFromPath(bundled, finalPath, onProgress, 'bundled binary');
      } catch (e) {
        logger.warn('Bundled geth failed', { error: (e as Error).message });
      }
    }

    // Strategy 2: System geth that passes PoW check
    const systemGeth = findSystemGeth();
    if (systemGeth) {
      try {
        return await installFromPath(systemGeth, finalPath, onProgress, 'system PATH');
      } catch (e) {
        logger.warn('System geth failed PoW check', { error: (e as Error).message });
      }
    }

    throw new Error(
      'Could not find a PoW-compatible Geth binary. Mars Credit requires Geth v1.12 or earlier. ' +
      'The bundled binary was not found. Please ensure the miner-apple-silicon directory is present in the monorepo.'
    );
  }

  // ── Linux / Windows: download from gethstore ──
  const url = getArchiveUrl(platformKey);
  if (!url) {
    throw new Error(`Unsupported platform for Geth download: ${platformKey}`);
  }

  const ext = path.extname(url);
  const archivePath = path.join(os.tmpdir(), `geth-download-${Date.now()}${ext}`);

  try {
    await downloadFile(url, archivePath, onProgress);
    const extractDir = path.join(os.tmpdir(), `geth-extract-${Date.now()}`);
    const extractedBinary = ext === '.zip'
      ? await extractZip(archivePath, extractDir)
      : await extractTarGz(archivePath, extractDir);

    fs.copyFileSync(extractedBinary, finalPath);
    if (process.platform !== 'win32') {
      fs.chmodSync(finalPath, 0o755);
    }

    fs.unlinkSync(archivePath);
    fs.rmSync(extractDir, { recursive: true, force: true });

    const version = await getGethVersion(finalPath);
    logger.info('Geth downloaded and verified', { path: finalPath, version });
    return { path: finalPath, version };
  } finally {
    if (fs.existsSync(archivePath)) {
      try { fs.unlinkSync(archivePath); } catch { /* ignore */ }
    }
  }
}

export function getGethPath(): string {
  return getGethBinaryPath();
}
