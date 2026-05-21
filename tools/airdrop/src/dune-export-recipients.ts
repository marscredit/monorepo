/**
 * Convert Dune getExecutionResults JSON (or saved export) into recipients.csv.
 * Filters labeled snapshot rows to likely EOAs.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getAddress, isAddress } from 'ethers';

const EXCLUDED_LABEL_TYPES = new Set(['cex', 'bridge', 'chadmin', 'dapp']);
const EXCLUDED_LABEL_SUBTYPES = new Set([
  'hot_wallet',
  'token_contract',
  'staking_contract',
  'bridge',
]);
const TREASURY = '0x6039e53688da87ebf30b0c84d22fcd6707b0c564';

type DuneRow = {
  address?: string;
  user_address?: string;
  label_type?: string;
  label_subtype?: string;
};

type DuneExport = {
  data?: { rows?: DuneRow[] };
};

function parseArgs() {
  const args = process.argv.slice(2);
  let input = '';
  let output = 'data/recipients.csv';
  let includeAll = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        input = args[++i] ?? '';
        break;
      case '--output':
        output = args[++i] ?? output;
        break;
      case '--include-all':
        includeAll = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage:
  npm run dune:export -- --input path/to/dune-results.json [--output data/recipients.csv]
  npm run dune:export -- --input path/to/dune-results.json --include-all

Options:
  --include-all   Skip EOA label filter (export every address row)
`);
        process.exit(0);
    }
  }

  if (!input) throw new Error('--input is required');
  return { input: resolve(input), output: resolve(output), includeAll };
}

function isLikelyEoa(row: DuneRow): boolean {
  if (row.label_type && EXCLUDED_LABEL_TYPES.has(row.label_type.toLowerCase())) return false;
  if (row.label_subtype && EXCLUDED_LABEL_SUBTYPES.has(row.label_subtype.toLowerCase())) return false;
  return true;
}

function main(): void {
  const { input, output, includeAll } = parseArgs();
  const raw = JSON.parse(readFileSync(input, 'utf8')) as DuneExport;
  const rows = raw.data?.rows ?? [];

  const seen = new Set<string>();
  const addresses: string[] = [];

  for (const row of rows) {
    const rawAddr = row.address ?? row.user_address;
    if (!rawAddr || !isAddress(rawAddr)) continue;
    if (!includeAll && !isLikelyEoa(row)) continue;

    const addr = getAddress(rawAddr);
    if (addr.toLowerCase() === TREASURY.toLowerCase()) continue;

    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    addresses.push(addr);
  }

  const dir = dirname(output);
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });

  const lines = ['address', ...addresses];
  writeFileSync(output, `${ lines.join('\n') }\n`, 'utf8');

  console.log(
    JSON.stringify({
      input,
      output,
      totalInputRows: rows.length,
      exportedAddresses: addresses.length,
      includeAll,
    }),
  );
}

main();
