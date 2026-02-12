/**
 * Structured logging to files and optional console.
 * Used by main process services.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getLogsDir } from './paths';

let logDir: string | null = null;

function ensureLogDir(): string {
  if (!logDir) {
    logDir = getLogsDir();
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  return logDir;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const line = JSON.stringify({ timestamp, level, message, ...meta }) + '\n';
  const dir = ensureLogDir();
  const file = path.join(dir, 'app.log');
  try {
    fs.appendFileSync(file, line);
  } catch {
    // ignore write errors
  }
  if (process.env.DEBUG || level === 'error') {
    console[level === 'debug' ? 'log' : level](message, meta ?? '');
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
};
