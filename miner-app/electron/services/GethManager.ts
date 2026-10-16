/**
 * GethManager: Download, verify, and manage Geth binary per platform.
 *
 * Mars Credit runs its own geth fork (go-marscredit branch mars-fast-v1, version
 * 1.10.18-mars-fast1): ethash PoW, 2 s LWMA difficulty after the fast-block fork.
 * Every platform must run that build. Stock geth (any version) will fork off the
 * chain at the fork height, and post-merge geth (v1.13+) cannot mine at all.
 *
 * macOS and Windows: use the fork binary bundled in the app (resources/geth/geth or
 * geth.exe, one per OS/arch build). Windows and Linux fall back to downloading the
 * fork build from the go-marscredit GitHub release, with a SHA-256 check.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as crypto from 'crypto';
import { execSync, spawn } from 'child_process';
import { app } from 'electron';
import { getPlatformKey, isMac, type PlatformKey } from '../utils/platform';
import { getBinDir, getGethBinaryPath } from '../utils/paths';
import { logger } from '../utils/logger';

/** Version string every Mars geth must report (`geth version` -> "Version: 1.10.18-mars-fast1"). */
export const REQUIRED_GETH_VERSION = '1.10.18-mars-fast1';
const GETH_RELEASE_TAG = 'v1.10.18-mars-fast1';
const BASE_URL = `https://github.com/marscredit/go-marscredit/releases/download/${GETH_RELEASE_TAG}`;

// SHA-256 of the release assets (built from go-marscredit mars-fast-v1 @ 4d549c7f).
// The files uploaded to the release must be byte-identical to these.
const PLATFORM_ARCHIVES: Partial<Record<PlatformKey, { name: string; sha256: string }>> = {
  'win32-x64': { name: 'geth-windows-amd64.zip', sha256: 'd7ebe8c61d15a6938467414811203233644257775e54a545b62e45c903578dab' },
  'linux-x64': { name: 'geth-linux-amd64.tar.gz', sha256: '258898f681b7140c03a515ee4bf186f6cc05c545e11761f4a3e25b430e6d24df' },
  'linux-arm64': { name: 'geth-linux-arm64.tar.gz', sha256: 'fa95a1a8bd7fd0d60b8d84e8915eef66675dded7b3af11a0fe513cd89d002989' },
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

function getArchive(platformKey: PlatformKey): { url: string; sha256: string } | null {
  const a = PLATFORM_ARCHIVES[platformKey];
  if (!a) return null;
  return { url: `${BASE_URL}/${a.name}`, sha256: a.sha256 };
}

function sha256File(p: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

/** True if the binary reports the required Mars fork version. */
export function isMarsGeth(binaryPath: string): boolean {
  try {
    const out = execSync(`"${binaryPath}" version`, { encoding: 'utf8', timeout: 10_000, stdio: 'pipe' });
    return out.includes(`Version: ${REQUIRED_GETH_VERSION}`);
  } catch {
    return false;
  }
}

/** Returns true if this is an Apple Silicon Mac (arm64). */
function isAppleSilicon(): boolean {
  return process.platform === 'darwin' && process.arch === 'arm64';
}

/** Read a Mach-O header and report whether the binary is x86_64-only. */
function isX86_64MachO(binaryPath: string): boolean {
  try {
    const fd = fs.openSync(binaryPath, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    // MH_MAGIC_64 (0xfeedfacf, little-endian) followed by CPU_TYPE_X86_64 (0x01000007)
    return buf.readUInt32LE(0) === 0xfeedfacf && buf.readUInt32LE(4) === 0x01000007;
  } catch {
    return false;
  }
}

/**
 * Check whether Rosetta 2 is needed and installed. Only matters on Apple Silicon when
 * the geth we would run is an x86_64 binary. The Apple Silicon app build bundles a
 * native arm64 geth, so Rosetta is not needed there. The rosetta directory is created
 * by the OS when Rosetta is installed; this avoids spawning a subprocess.
 */
export function isRosettaInstalled(): boolean {
  if (!isAppleSilicon()) return true;
  const bundled = findBundledGeth();
  if (bundled && !isX86_64MachO(bundled)) return true;
  try {
    return fs.existsSync('/Library/Apple/usr/share/rosetta');
  } catch {
    return false;
  }
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
      const match = out.match(/Version: (\d+\.\d+\.\d+(?:-[\w.-]+)?)/);
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
    if (supportsPoWMining(p) && isMarsGeth(p)) {
      logger.info('Found Mars geth on system', { path: p });
      return p;
    }
    logger.info(`System geth is not ${REQUIRED_GETH_VERSION}, skipping`, { path: p });
  }
  return null;
}

/** Check if Geth binary exists, is runnable, AND supports PoW mining. */
export async function isGethAvailable(customPath?: string): Promise<{ ok: boolean; path: string; version?: string; rosettaMissing?: boolean }> {
  if (isAppleSilicon() && !isRosettaInstalled()) {
    return { ok: false, path: getGethBinaryPath(), rosettaMissing: true };
  }
  const binPath = customPath || getGethBinaryPath();
  // An existing install of stock geth must be replaced, so require the fork version.
  if (fs.existsSync(binPath) && supportsPoWMining(binPath) && isMarsGeth(binPath)) {
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
 * Find the bundled Mars geth binary (1.10.18-mars-fast1).
 *
 * Packaged app: geth lives under process.resourcesPath/geth/geth (via extraResources).
 * Dev mode: __dirname is dist-electron/services/, so ../../.. reaches the monorepo root
 *           where miner-apple-silicon/Resources/geth/geth exists.
 */
function findBundledGeth(): string | null {
  const candidates: string[] = [];
  const exe = process.platform === 'win32' ? 'geth.exe' : 'geth';

  // Packaged app — extraResources copies resources/geth/<os>-<arch>/geth[.exe] → <resourcesPath>/geth/geth[.exe]
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'geth', exe));
  }
  if (process.platform === 'win32') {
    // Windows has no dev-mode fallbacks below (they are darwin binaries).
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        logger.info('Found bundled geth', { path: p });
        return p;
      }
    }
    return null;
  }

  // Dev mode: dist-electron/services/ -> dist-electron/ -> miner-app/ -> monorepo/
  const monorepoRoot = path.resolve(__dirname, '..', '..', '..');
  candidates.push(
    path.join(monorepoRoot, 'miner-apple-silicon', 'Resources', 'geth', 'geth'),
    path.join(monorepoRoot, 'miner-apple-silicon', 'builds', 'build29',
      'Mars Credit Miner.app', 'Contents', 'Resources', 'geth', 'geth'),
  );

  // Dev mode: also try miner-app/resources/geth/darwin-<arch>/geth (filled by scripts/prepare-geth.mjs)
  const devArch = process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
  candidates.push(
    path.join(monorepoRoot, 'miner-app', 'resources', 'geth', devArch, 'geth'),
    path.join(monorepoRoot, 'miner-app', 'resources', 'geth', 'geth'),
  );

  // app.getAppPath() in dev points to the miner-app project root
  try {
    const appRoot = app.getAppPath();
    candidates.push(
      path.join(appRoot, 'resources', 'geth', devArch, 'geth'),
      path.join(appRoot, 'resources', 'geth', 'geth'),
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

  if (!supportsPoWMining(finalPath) || !isMarsGeth(finalPath)) {
    fs.unlinkSync(finalPath);
    throw new Error(`${label || sourcePath} is not Mars geth ${REQUIRED_GETH_VERSION}`);
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
    if (isAppleSilicon() && !isRosettaInstalled()) {
      throw new Error(
        'ROSETTA_REQUIRED: Rosetta 2 is required to run the Mars Credit miner on Apple Silicon. ' +
        'Open Terminal and run: softwareupdate --install-rosetta'
      );
    }

    onProgress?.({ percent: 5, downloadedBytes: 0, totalBytes: 0 });

    // Strategy 1: Bundled Mars fork binary (resources/geth/geth)
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
      `Could not find Mars geth ${REQUIRED_GETH_VERSION}. The bundled binary (resources/geth/geth) ` +
      'is missing or is not the Mars fork build.'
    );
  }

  // ── Windows: bundled Mars fork geth.exe first (shipped in the installer) ──
  if (process.platform === 'win32') {
    const bundled = findBundledGeth();
    if (bundled) {
      try {
        return await installFromPath(bundled, finalPath, onProgress, 'bundled binary');
      } catch (e) {
        logger.warn('Bundled geth.exe failed, falling back to download', { error: (e as Error).message });
      }
    }
  }

  // ── Linux / Windows fallback: download the Mars fork build from the go-marscredit release ──
  const archive = getArchive(platformKey);
  if (!archive) {
    throw new Error(`Unsupported platform for Geth download: ${platformKey}`);
  }
  const url = archive.url;

  const ext = path.extname(url);
  const archivePath = path.join(os.tmpdir(), `geth-download-${Date.now()}${ext}`);

  try {
    await downloadFile(url, archivePath, onProgress);
    const got = sha256File(archivePath);
    if (got !== archive.sha256) {
      throw new Error(`Checksum mismatch for ${url}: got ${got}, want ${archive.sha256}`);
    }
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

    if (!isMarsGeth(finalPath)) {
      fs.unlinkSync(finalPath);
      throw new Error(`Downloaded geth is not ${REQUIRED_GETH_VERSION}`);
    }
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
