/**
 * Genesis initialization for Mars Credit chain.
 * Runs geth init with mars_credit_genesis.json when a miner data dir is first created.
 * Detects stale/wrong genesis (e.g. Ethereum mainnet ChainID:1) and re-initializes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { app } from 'electron';
import { getMinerDataDir } from '../utils/paths';
import { logger } from '../utils/logger';

const CHAINDATA_DIR = 'geth/chaindata';
const GENESIS_MARKER = '.mars-genesis-ok';
const MARS_CHAIN_ID = 110110;

/** Resolve path to genesis.json (dev: miner-app/resources, packaged: resources next to app). */
export function getGenesisPath(): string {
  if (app.isPackaged && process.resourcesPath) {
    const p = path.join(process.resourcesPath, 'genesis.json');
    if (fs.existsSync(p)) return p;
  }
  const fromApp = path.join(app.getAppPath(), 'resources', 'genesis.json');
  if (fs.existsSync(fromApp)) return fromApp;
  const fromDir = path.join(__dirname, '..', '..', 'resources', 'genesis.json');
  if (fs.existsSync(fromDir)) return fromDir;
  throw new Error('genesis.json not found in resources');
}

/** Wipe the geth subdirectory so genesis can be re-applied cleanly. */
function wipeGethData(dataDir: string): void {
  const gethDir = path.join(dataDir, 'geth');
  if (fs.existsSync(gethDir)) {
    logger.info('Wiping stale geth data for re-initialization', { gethDir });
    fs.rmSync(gethDir, { recursive: true, force: true });
  }
}

/** Ensure miner data dir exists and run geth init if chaindata does not exist or has wrong genesis. */
export function initMinerDataDir(
  gethBinaryPath: string,
  minerIndex: number,
  genesisPath?: string
): void {
  const dataDir = getMinerDataDir(minerIndex);
  const chaindataDir = path.join(dataDir, CHAINDATA_DIR);
  const markerPath = path.join(dataDir, GENESIS_MARKER);

  if (fs.existsSync(chaindataDir) && fs.existsSync(markerPath)) {
    logger.debug('Chaindata exists with valid Mars genesis marker, skipping init', { dataDir });
    return;
  }

  if (fs.existsSync(chaindataDir) && !fs.existsSync(markerPath)) {
    logger.warn('Chaindata exists but Mars genesis marker missing -- wiping for re-init', { dataDir });
    wipeGethData(dataDir);
  }

  const genesis = genesisPath || getGenesisPath();
  if (!fs.existsSync(genesis)) {
    throw new Error(`Genesis file not found: ${genesis}`);
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'keystore'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'logs'), { recursive: true });

  logger.info('Initializing miner data dir with Mars Credit genesis', { dataDir, genesis });
  try {
    execSync(`"${gethBinaryPath}" --datadir "${dataDir}" init "${genesis}"`, {
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
    });
    fs.writeFileSync(markerPath, JSON.stringify({ chainId: MARS_CHAIN_ID, initAt: new Date().toISOString() }));
    logger.info('Genesis initialization successful', { dataDir });
  } catch (e) {
    const err = e as Error & { stdout?: Buffer; stderr?: Buffer };
    const out = err.stdout?.toString() || '';
    const errOut = err.stderr?.toString() || '';
    logger.error('Genesis init failed', { message: err.message, stdout: out, stderr: errOut });
    throw new Error(`geth init failed: ${err.message}\n${out}\n${errOut}`);
  }
}
