/**
 * MinerService: Orchestrates multiple MinerInstances (one per tab).
 * Manages tab lifecycle, start/stop, and config per miner.
 */

import { EventEmitter } from 'events';
import { MinerInstance, type MinerInstanceConfig } from './MinerInstance';
import { getGethBinaryPath } from '../utils/paths';
import { logger } from '../utils/logger';

export interface MinerTabState {
  minerIndex: number;
  running: boolean;
  pid?: number;
  rpcUrl: string;
  config: {
    minerThreads: number;
    cacheMB: number;
    etherbase?: string;
  };
}

export interface MinerServiceEvents {
  on(event: 'minerLog', listener: (minerIndex: number, line: string, source: 'stdout' | 'stderr') => void): void;
  on(event: 'minerState', listener: (minerIndex: number, state: Partial<MinerTabState>) => void): void;
}

export class MinerService extends EventEmitter {
  private instances: Map<number, MinerInstance> = new Map();
  private configCache: Map<number, { minerThreads: number; cacheMB: number; etherbase?: string }> = new Map();
  private gethPath: string = getGethBinaryPath();

  /** Set path to Geth binary (e.g. after download). */
  setGethPath(path: string): void {
    this.gethPath = path;
  }

  getGethPath(): string {
    return this.gethPath;
  }

  /** Get or create miner instance. Tab indices are 1-based. */
  getOrCreateInstance(minerIndex: number, config?: Partial<MinerInstanceConfig>): MinerInstance {
    const cached = this.configCache.get(minerIndex) ?? { minerThreads: 1, cacheMB: 4096 };
    const merged = {
      minerThreads: config?.minerThreads ?? cached.minerThreads,
      cacheMB: config?.cacheMB ?? cached.cacheMB,
      etherbase: config?.etherbase ?? cached.etherbase,
    };
    this.configCache.set(minerIndex, merged);

    let inst = this.instances.get(minerIndex);
    if (!inst) {
      inst = new MinerInstance({
        minerIndex,
        gethBinaryPath: this.gethPath,
        ...merged,
      });
      inst.on('log', (line, source) => {
        this.emit('minerLog', minerIndex, line, source);
      });
      inst.on('exit', () => {
        this.emit('minerState', minerIndex, { running: false, pid: undefined });
      });
      this.instances.set(minerIndex, inst);
    } else if (config) {
      inst.updateConfig(config);
    }
    return inst;
  }

  /** Get current tab (miner) indices. */
  getTabIndices(): number[] {
    return Array.from(this.instances.keys()).sort((a, b) => a - b);
  }

  /** Add a new miner tab. Returns the new miner index. */
  addTab(config?: Partial<MinerInstanceConfig>): number {
    const existing = this.getTabIndices();
    const nextIndex = existing.length === 0 ? 1 : Math.max(...existing) + 1;
    this.getOrCreateInstance(nextIndex, config);
    return nextIndex;
  }

  /** Remove a miner tab. Stops the miner if running. */
  removeTab(minerIndex: number): void {
    const inst = this.instances.get(minerIndex);
    if (inst) {
      inst.stop();
      this.instances.delete(minerIndex);
      this.configCache.delete(minerIndex);
    }
  }

  /** Start a miner by index. */
  async startMiner(minerIndex: number, config?: Partial<MinerInstanceConfig>): Promise<void> {
    const inst = this.getOrCreateInstance(minerIndex, config);
    if (inst.isRunning) {
      logger.info('Miner already running', { minerIndex });
      return;
    }
    await inst.start();
    const cached = this.configCache.get(minerIndex) ?? { minerThreads: 1, cacheMB: 4096 };
    this.emit('minerState', minerIndex, {
      running: true,
      pid: inst.pid,
      rpcUrl: inst.rpcUrl,
      config: { ...cached },
    });
  }

  /** Stop a miner by index. */
  stopMiner(minerIndex: number): void {
    const inst = this.instances.get(minerIndex);
    if (inst) {
      inst.stop();
      this.emit('minerState', minerIndex, { running: false, pid: undefined });
    }
  }

  /** Get state for a miner. */
  getMinerState(minerIndex: number): MinerTabState | null {
    const inst = this.instances.get(minerIndex);
    if (!inst) return null;
    const cached = this.configCache.get(minerIndex) ?? { minerThreads: 1, cacheMB: 4096 };
    return {
      minerIndex: inst.minerIndex,
      running: inst.isRunning,
      pid: inst.pid,
      rpcUrl: inst.rpcUrl,
      config: {
        minerThreads: cached.minerThreads,
        cacheMB: cached.cacheMB,
        etherbase: cached.etherbase,
      },
    };
  }

  /** Get RPC URL for a miner (for NetworkService). */
  getRpcUrl(minerIndex: number): string | null {
    const inst = this.instances.get(minerIndex);
    return inst?.rpcUrl ?? null;
  }

  /** Get indices of miners that are currently running (for sleep/wake resume). */
  getRunningMinerIndices(): number[] {
    return Array.from(this.instances.entries())
      .filter(([, inst]) => inst.isRunning)
      .map(([idx]) => idx);
  }

  /** Stop all miners (e.g. on app quit). */
  stopAll(): void {
    for (const [idx, inst] of this.instances) {
      inst.stop();
      this.emit('minerState', idx, { running: false, pid: undefined });
    }
  }
}

export const minerService = new MinerService();
