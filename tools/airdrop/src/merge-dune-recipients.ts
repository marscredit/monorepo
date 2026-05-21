/**
 * Merge tiered Dune JSON exports + labeled snapshot into recipients.csv.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { getAddress, isAddress } from 'ethers';
import { TREASURY_ADDRESS } from './constants.js';

const INFRA_ADDRESSES = new Set([
  '0x00000000219ab540356cBB839Cbe05303d7705Fa'.toLowerCase(),
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase(),
]);

const EXCLUDED_LABEL_TYPES = new Set(['cex', 'bridge', 'chadmin', 'dapp']);
const EXCLUDED_LABEL_SUBTYPES = new Set([
  'hot_wallet',
  'token_contract',
  'staking_contract',
  'bridge',
]);

type DuneRow = {
  address?: string;
  user_address?: string;
  eth_balance?: number | string;
  balance?: number | string;
  label_type?: string;
  label_subtype?: string;
};

type DuneExport = {
  data?: { rows?: DuneRow[] };
  resultMetadata?: { executionCostCredits?: string; totalRowCount?: number };
};

type RecipientEntry = {
  address: string;
  ethBalance: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const dataDir = resolve('data');
  const inputs: string[] = [];
  let output = join(dataDir, 'recipients.csv');
  let summaryPath = join(dataDir, 'recipients-summary.json');
  let cexPath = join(dataDir, 'cex-addresses.json');
  let minTarget = 15_000;
  let maxRecipients: number | undefined = 20_000;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        inputs.push(resolve(args[++i] ?? ''));
        break;
      case '--output':
        output = resolve(args[++i] ?? output);
        break;
      case '--summary':
        summaryPath = resolve(args[++i] ?? summaryPath);
        break;
      case '--cex':
        cexPath = resolve(args[++i] ?? cexPath);
        break;
      case '--min-target':
        minTarget = Number(args[++i]);
        break;
      case '--max-recipients': {
        const n = args[++i];
        maxRecipients = n === 'none' ? undefined : Number(n);
        break;
      }
      case '--help':
      case '-h':
        console.log(`
Merge Dune tier exports into recipients.csv

  npm run dune:merge

Defaults (if files exist in data/):
  dune-tier1.json, dune-tier2.json, dune-tier3.json, dune-tier4.json
  dune-tier4-low.json, dune-export-3500.json, cex-addresses.json

Options:
  --input <path>     Extra JSON export (repeatable)
  --output <path>    Output CSV (default: data/recipients.csv)
  --cex <path>       CEX address list JSON from Dune
  --min-target <n>   Warn if count below n (default: 15000)
  --max-recipients <n>|none  Cap output to top N by ETH balance (default: 20000)
`);
        process.exit(0);
    }
  }

  if (inputs.length === 0) {
    const defaults = [
      'dune-p2p-holders.json',
      'dune-p2p-holders-2.json',
      'dune-beesblabs.json',
      'dune-tier1.json',
      'dune-tier2.json',
      'dune-tier3.json',
      'dune-tier4.json',
      'dune-tier4-low.json',
      'dune-export-3500.json',
    ];
    for (const name of defaults) {
      const p = join(dataDir, name);
      if (existsSync(p)) inputs.push(p);
    }
  }

  return { inputs, output, summaryPath, cexPath, minTarget, maxRecipients };
}

function loadCexSet(cexPath: string): Set<string> {
  if (!existsSync(cexPath)) return new Set();
  const raw = JSON.parse(readFileSync(cexPath, 'utf8')) as DuneExport;
  const rows = raw.data?.rows ?? [];
  const set = new Set<string>();
  for (const row of rows) {
    const a = row.address;
    if (a && isAddress(a)) set.add(getAddress(a).toLowerCase());
  }
  return set;
}

function parseBalance(row: DuneRow): number {
  const v = row.eth_balance ?? row.balance;
  if (v === undefined || v === null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

function isLikelyEoa(row: DuneRow): boolean {
  if (!row.label_type && !row.label_subtype) return true;
  if (row.label_type && EXCLUDED_LABEL_TYPES.has(row.label_type.toLowerCase())) return false;
  if (row.label_subtype && EXCLUDED_LABEL_SUBTYPES.has(row.label_subtype.toLowerCase())) return false;
  return true;
}

function normalizeRowAddress(row: DuneRow): string | null {
  const raw = row.address ?? row.user_address;
  if (!raw || !isAddress(raw)) return null;
  return getAddress(raw);
}

function main(): void {
  const { inputs, output, summaryPath, cexPath, minTarget, maxRecipients } = parseArgs();
  const cexSet = loadCexSet(cexPath);
  const treasury = TREASURY_ADDRESS.toLowerCase();

  const byAddress = new Map<string, RecipientEntry>();
  const sourceStats: Record<string, number> = {};

  for (const inputPath of inputs) {
    if (!existsSync(inputPath)) continue;
    const raw = JSON.parse(readFileSync(inputPath, 'utf8')) as DuneExport;
    const rows = raw.data?.rows ?? [];
    let added = 0;

    for (const row of rows) {
      if (!isLikelyEoa(row)) continue;
      const addr = normalizeRowAddress(row);
      if (!addr) continue;

      const key = addr.toLowerCase();
      if (key === treasury) continue;
      if (cexSet.has(key)) continue;
      if (INFRA_ADDRESSES.has(key)) continue;

      const bal = parseBalance(row);
      const existing = byAddress.get(key);
      if (!existing || bal > existing.ethBalance) {
        byAddress.set(key, { address: addr, ethBalance: bal });
        if (!existing) added++;
      } else if (existing && bal > 0 && bal > existing.ethBalance) {
        existing.ethBalance = bal;
      }
    }

    sourceStats[inputPath] = added;
  }

  let sorted = [...byAddress.values()].sort((a, b) => b.ethBalance - a.ethBalance);
  const totalBeforeCap = sorted.length;
  if (maxRecipients !== undefined && sorted.length > maxRecipients) {
    sorted = sorted.slice(0, maxRecipients);
  }
  const dir = dirname(output);
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });

  const lines = ['address', ...sorted.map((r) => r.address)];
  writeFileSync(output, `${ lines.join('\n') }\n`, 'utf8');

  const balances = sorted.map((r) => r.ethBalance).filter((b) => b > 0);
  const summary = {
    generatedAt: new Date().toISOString(),
    recipientCount: sorted.length,
    totalBeforeCap,
    maxRecipients: maxRecipients ?? null,
    minEthBalance: balances.length ? Math.min(...balances) : 0,
    maxEthBalance: balances.length ? Math.max(...balances) : 0,
    cexExcluded: cexSet.size,
    inputs: sourceStats,
    output,
    meetsMinTarget: sorted.length >= minTarget,
    minTarget,
  };

  writeFileSync(summaryPath, `${ JSON.stringify(summary, null, 2) }\n`, 'utf8');

  console.log(JSON.stringify(summary));

  if (sorted.length < minTarget) {
    console.error(
      `[merge] Warning: ${ sorted.length } recipients < target ${ minTarget }. Consider running ethereum_tier4_low.sql.`,
    );
    process.exit(1);
  }
}

main();
