import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type TransferLogEntry = {
  index: number;
  to: string;
  amountMars: string;
  txHash?: string;
  status: 'confirmed' | 'failed' | 'skipped';
  error?: string;
  timestamp: string;
};

export function appendJsonl(filePath: string, entry: TransferLogEntry): void {
  const dir = dirname(filePath);
  if (dir && dir !== '.') {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(filePath, `${ JSON.stringify(entry) }\n`, 'utf8');
}

export function logInfo(message: string, fields?: Record<string, unknown>): void {
  const payload = fields ? ` ${ JSON.stringify(fields) }` : '';
  console.log(`[airdrop] ${ message }${ payload }`);
}

export function logError(message: string, fields?: Record<string, unknown>): void {
  const payload = fields ? ` ${ JSON.stringify(fields) }` : '';
  console.error(`[airdrop] ${ message }${ payload }`);
}
