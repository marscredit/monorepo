/**
 * GethManager: Download, verify, and manage Geth binary per platform.
 * Downloads from official gethstore; does not bundle Geth.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import { execSync, spawn } from 'child_process';
import { getPlatformKey, type PlatformKey } from '../utils/platform';
import { getBinDir, getGethBinaryPath } from '../utils/paths';
import { logger } from '../utils/logger';

const GETH_VERSION = '1.16.8';
const GETH_COMMIT = 'abeb78c6';
const BASE_URL = 'https://gethstore.blob.core.windows.net/builds';

/** Map platform key to Geth archive filename (without base URL). */
const PLATFORM_ARCHIVES: Partial<Record<PlatformKey, string>> = {
  'darwin-arm64': `geth-darwin-arm64-${GETH_VERSION}-${GETH_COMMIT}.tar.gz`,
  'darwin-x64': `geth-darwin-amd64-${GETH_VERSION}-${GETH_COMMIT}.tar.gz`,
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

/** Download a file with progress callback. */
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

/** Find geth binary in directory (may be at root or in a subdir). */
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

/** Extract .tar.gz using system tar (Unix). */
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

/** Extract .zip using adm-zip (Windows). */
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

/** Ensure bin dir exists and return path to Geth binary. */
function ensureBinDir(): string {
  const binDir = getBinDir();
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  return binDir;
}

/** Run geth version and return version string. */
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

/** Check if Geth binary exists and is runnable. */
export async function isGethAvailable(customPath?: string): Promise<{ ok: boolean; path: string; version?: string }> {
  const binPath = customPath || getGethBinaryPath();
  if (!fs.existsSync(binPath)) {
    return { ok: false, path: binPath };
  }
  try {
    const version = await getGethVersion(binPath);
    return { ok: true, path: binPath, version };
  } catch {
    return { ok: false, path: binPath };
  }
}

/** Download Geth for current platform. Progress 0-100. */
export async function downloadGeth(
  onProgress?: (p: GethDownloadProgress) => void
): Promise<GethManagerResult> {
  const platformKey = getPlatformKey();
  let url = getArchiveUrl(platformKey);

  // Fallback: Apple Silicon may use amd64 with Rosetta if no arm64 build
  if (!url && platformKey === 'darwin-arm64') {
    url = getArchiveUrl('darwin-x64');
    logger.info('No darwin-arm64 build, using darwin-amd64 (Rosetta)');
  }
  if (!url) {
    throw new Error(`Unsupported platform for Geth download: ${platformKey}`);
  }

  const binDir = ensureBinDir();
  const ext = path.extname(url);
  const archivePath = path.join(os.tmpdir(), `geth-download-${Date.now()}${ext}`);

  try {
    await downloadFile(url, archivePath, onProgress);
    const isZip = ext === '.zip';
    const extractDir = path.join(os.tmpdir(), `geth-extract-${Date.now()}`);
    const extractedBinary = isZip
      ? await extractZip(archivePath, extractDir)
      : await extractTarGz(archivePath, extractDir);

    const finalPath = getGethBinaryPath();
    fs.copyFileSync(extractedBinary, finalPath);
    if (process.platform !== 'win32') {
      fs.chmodSync(finalPath, 0o755);
    }

    // Cleanup
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

/** Get path to Geth binary (may not exist yet). */
export function getGethPath(): string {
  return getGethBinaryPath();
}
