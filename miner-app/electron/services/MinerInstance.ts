/**
 * MinerInstance: Single Geth process lifecycle for one miner tab.
 * Spawns Geth with Mars Credit network config, tracks PID, monitors health, streams logs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import {
  getMinerDataDir,
  getMinerKeystoreDir,
  getMinerLogsDir,
  getMinerPidPath,
} from '../utils/paths';
import { logger } from '../utils/logger';
import { initMinerDataDir } from './GenesisInit';

const NETWORK_ID = 110110;
const BOOTNODES =
  'enode://bf93a274569cd009e4172c1a41b8bde1fb8d8e7cff1e5130707a0cf5be4ce0fc673c8a138ecb7705025ea4069da8c1d4b7ffc66e8666f7936aa432ce57693353@roundhouse.proxy.rlwy.net:50590,' +
  'enode://ca3639067a580a0f1db7412aeeef6d5d5e93606ed7f236a5343fe0d1115fb8c2bea2a22fa86e9794b544f886a4cb0de1afcbccf60960802bf00d81dab9553ec9@monorail.proxy.rlwy.net:26254,' +
  'enode://7f2ee75a1c112735aaa43de1e5a6c4d7e07d03a5352b5782ed8e0c7cc046a8c8839ad093b09649e0b4a6ed8900211fb4438765c99d07bb00006ef080a1aa9ab6@viaduct.proxy.rlwy.net:30270,' +
  'enode://98710174f4798dae1931e417944ac7a7fb3268d38ef8d3941c8fcc44fe178b118003d8b3d61d85af39c561235a1708f8dd61f8ba47df4c4a6b9156e272af2cfc@monorail.proxy.rlwy.net:29138';

export interface MinerInstanceConfig {
  minerIndex: number;
  gethBinaryPath: string;
  minerThreads?: number;
  cacheMB?: number;
  etherbase?: string;
}

export interface MinerInstanceEvents {
  on(event: 'log', listener: (line: string, source: 'stdout' | 'stderr') => void): void;
  on(event: 'exit', listener: (code: number | null, signal: string | null) => void): void;
  on(event: 'error', listener: (err: Error) => void): void;
}

function getPorts(minerIndex: number): { http: number; ws: number; p2p: number } {
  const i = minerIndex - 1;
  return {
    http: 8546 + i * 2,
    ws: 8547 + i * 2,
    p2p: 30304 + i,
  };
}

export class MinerInstance extends EventEmitter {
  private config: MinerInstanceConfig;
  private process: ChildProcess | null = null;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private healthFailures = 0;
  private readonly maxHealthFailures = 3;
  private readonly healthCheckIntervalMs = 5000;

  constructor(config: MinerInstanceConfig) {
    super();
    this.config = config;
  }

  get minerIndex(): number {
    return this.config.minerIndex;
  }

  get httpPort(): number {
    return getPorts(this.config.minerIndex).http;
  }

  get rpcUrl(): string {
    return `http://localhost:${this.httpPort}`;
  }

  get isRunning(): boolean {
    return this.process != null && this.process.exitCode == null;
  }

  get pid(): number | undefined {
    return this.process?.pid;
  }

  /** Start Geth. Ensures genesis init, then spawns process. */
  async start(): Promise<void> {
    if (this.process) {
      logger.warn('MinerInstance already running', { minerIndex: this.config.minerIndex });
      return;
    }

    initMinerDataDir(this.config.gethBinaryPath, this.config.minerIndex);

    const dataDir = getMinerDataDir(this.config.minerIndex);
    const keystoreDir = getMinerKeystoreDir(this.config.minerIndex);
    const logsDir = getMinerLogsDir(this.config.minerIndex);
    fs.mkdirSync(logsDir, { recursive: true });

    const { http, ws, p2p } = getPorts(this.config.minerIndex);
    const threads = this.config.minerThreads ?? 1;
    const cache = this.config.cacheMB ?? 4096;

    const args = [
      '--datadir', dataDir,
      '--keystore', keystoreDir,
      '--syncmode', 'full',
      '--gcmode', 'full',
      '--http', '--http.addr', 'localhost', '--http.port', String(http),
      '--http.api', 'personal,eth,net,web3,miner,admin,debug',
      '--http.vhosts', '*', '--http.corsdomain', '*',
      '--ws', '--ws.addr', 'localhost', '--ws.port', String(ws),
      '--ws.api', 'personal,eth,net,web3,miner,admin,debug',
      '--port', String(p2p),
      '--networkid', String(NETWORK_ID),
      '--bootnodes', BOOTNODES,
      '--nat', 'any',
      '--mine', '--miner.threads', String(threads),
      '--verbosity', '3',
      '--maxpeers', '50',
      '--cache', String(cache),
      '--cache.database', '75',
      '--cache.trie', '25',
      '--cache.gc', '25',
      '--cache.snapshot', '10',
      '--txpool.globalslots', '8192',
      '--txpool.globalqueue', '2048',
      '--nousb',
      '--metrics',
      '--allow-insecure-unlock',
      '--snapshot',
    ];

    if (this.config.etherbase) {
      args.push('--miner.etherbase', this.config.etherbase);
    }

    logger.info('Spawning Geth', { minerIndex: this.config.minerIndex, args: args.slice(0, 15) });

    const proc = spawn(this.config.gethBinaryPath, args, {
      cwd: dataDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });

    this.process = proc;

    const pidPath = getMinerPidPath(this.config.minerIndex);
    if (proc.pid) {
      fs.writeFileSync(pidPath, String(proc.pid), 'utf8');
    }

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        this.emit('log', line, 'stdout');
      }
    });
    proc.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        this.emit('log', line, 'stderr');
      }
    });

    proc.on('error', (err) => {
      logger.error('MinerInstance process error', { minerIndex: this.config.minerIndex, err: err.message });
      this.emit('error', err);
    });

    proc.on('exit', (code, signal) => {
      this.process = null;
      this.stopHealthCheck();
      if (fs.existsSync(pidPath)) {
        try { fs.unlinkSync(pidPath); } catch { /* ignore */ }
      }
      logger.info('MinerInstance exited', { minerIndex: this.config.minerIndex, code, signal });
      this.emit('exit', code, signal);
    });

    if (process.platform !== 'win32' && proc.pid) {
      (proc as ChildProcess & { unref?: () => void }).unref?.();
    }

    this.startHealthCheck();
  }

  private startHealthCheck(): void {
    this.healthFailures = 0;
    this.healthCheckTimer = setInterval(() => {
      this.checkHealth();
    }, this.healthCheckIntervalMs);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private async checkHealth(): Promise<void> {
    if (!this.process || this.process.exitCode != null) return;

    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'net_version',
          params: [],
          id: 1,
        }),
      });
      if (res.ok) {
        this.healthFailures = 0;
        return;
      }
    } catch {
      // ignore
    }

    this.healthFailures += 1;
    if (this.healthFailures >= this.maxHealthFailures) {
      logger.warn('MinerInstance health check failed repeatedly, stopping', {
        minerIndex: this.config.minerIndex,
        failures: this.healthFailures,
      });
      this.stop();
    }
  }

  /** Graceful shutdown: SIGTERM, then SIGKILL after 5s. */
  stop(): void {
    if (!this.process) return;

    const proc = this.process;
    this.process = null;
    this.stopHealthCheck();

    const pidPath = getMinerPidPath(this.config.minerIndex);
    if (fs.existsSync(pidPath)) {
      try { fs.unlinkSync(pidPath); } catch { /* ignore */ }
    }

    try {
      if (proc.pid && process.platform !== 'win32') {
        process.kill(proc.pid, 'SIGTERM');
      } else {
        proc.kill('SIGTERM');
      }
    } catch {
      proc.kill('SIGKILL');
    }

    const timeout = setTimeout(() => {
      try {
        if (proc.pid && process.platform !== 'win32') {
          process.kill(proc.pid, 'SIGKILL');
        } else {
          proc.kill('SIGKILL');
        }
      } catch {
        // already dead
      }
    }, 5000);

    proc.once('exit', () => {
      clearTimeout(timeout);
    });
  }

  updateConfig(updates: Partial<Pick<MinerInstanceConfig, 'minerThreads' | 'cacheMB' | 'etherbase'>>): void {
    this.config = { ...this.config, ...updates };
  }
}
