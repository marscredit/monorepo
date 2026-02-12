/**
 * Genesis initialization for Mars Credit chain.
 * Runs geth init with mars_credit_genesis.json when a miner data dir is first created.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { app } from 'electron';
import { getMinerDataDir } from '../utils/paths';
import { logger } from '../utils/logger';

const CHAINDATA_DIR = 'geth/chaindata';

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

/** Ensure miner data dir exists and run geth init if chaindata does not exist. */
export function initMinerDataDir(
  gethBinaryPath: string,
  minerIndex: number,
  genesisPath?: string
): void {
  const dataDir = getMinerDataDir(minerIndex);
  const chaindataDir = path.join(dataDir, CHAINDATA_DIR);

  if (fs.existsSync(chaindataDir)) {
    logger.debug('Chaindata exists, skipping genesis init', { dataDir });
    return;
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
    logger.info('Genesis initialization successful', { dataDir });
  } catch (e) {
    const err = e as Error & { stdout?: Buffer; stderr?: Buffer };
    const out = err.stdout?.toString() || '';
    const errOut = err.stderr?.toString() || '';
    logger.error('Genesis init failed', { message: err.message, stdout: out, stderr: errOut });
    throw new Error(`geth init failed: ${err.message}\n${out}\n${errOut}`);
  }
}
