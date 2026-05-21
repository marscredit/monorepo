import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  DEFAULT_AMOUNT_MARS,
  EXPECTED_ROW_COUNT,
  MAX_DISTRIBUTE_MARS,
  TREASURY_ADDRESS,
} from './constants.js';
import { findDuplicateAddresses, normalizeAddress, type AllocationRow } from './validate.js';

export type RecipientRow = {
  line: number;
  address: string;
};

export type GenerateOptions = {
  totalMars?: number;
  amountMars?: number;
  expectedCount?: number;
  treasuryAddress?: string;
};

/**
 * Parse a recipient list CSV (Dune/DeBank export).
 * Accepts headers: address, holder, wallet, user, or uses first column.
 */
export function parseRecipientsCsv(content: string): RecipientRow[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('Recipient CSV is empty');

  const headerParts = lines[0].split(',').map((p) => p.trim().toLowerCase().replace(/"/g, ''));
  const addressHeaderIndex = headerParts.findIndex((h) =>
    ['address', 'holder', 'wallet', 'user', 'account', 'owner'].includes(h),
  );
  const hasHeader = addressHeaderIndex >= 0 || headerParts.some((h) => h.includes('address'));
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const colIndex = addressHeaderIndex >= 0 ? addressHeaderIndex : 0;

  if (dataLines.length === 0) throw new Error('Recipient CSV has no data rows');

  const rows: RecipientRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = hasHeader ? i + 2 : i + 1;
    const parts = splitCsvLine(dataLines[i]);
    const raw = parts[colIndex]?.trim();
    if (!raw) throw new Error(`Line ${ lineNum }: missing address`);
    rows.push({
      line: lineNum,
      address: normalizeAddress(raw, lineNum),
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result;
}

export function computeAmountMars(
  recipientCount: number,
  options: GenerateOptions = {},
): string {
  if (recipientCount <= 0) throw new Error('Recipient count must be positive');

  if (options.amountMars !== undefined) {
    return String(options.amountMars);
  }

  const total = options.totalMars ?? MAX_DISTRIBUTE_MARS;

  if (total % recipientCount === 0) {
    return String(total / recipientCount);
  }

  const perWallet = total / recipientCount;
  throw new Error(
    `Total ${ total } MARS does not divide evenly across ${ recipientCount } wallets (${ perWallet } each). Set --amount-mars explicitly or adjust recipient count.`,
  );
}

export function buildAllocations(
  recipients: RecipientRow[],
  options: GenerateOptions = {},
): AllocationRow[] {
  const treasury = (options.treasuryAddress ?? TREASURY_ADDRESS).toLowerCase();
  const filtered = recipients.filter((r) => r.address.toLowerCase() !== treasury);

  if (filtered.length < recipients.length) {
    console.warn(`[generate] Excluded ${ recipients.length - filtered.length } treasury address row(s)`);
  }

  const asAllocation: AllocationRow[] = filtered.map((r) => ({
    line: r.line,
    address: r.address,
    amountMars: '0',
  }));

  const dupes = findDuplicateAddresses(asAllocation);
  if (dupes.length > 0) {
    throw new Error(`Duplicate addresses (${ dupes.length }): ${ dupes.slice(0, 5).join(', ') }`);
  }

  if (options.expectedCount !== undefined && filtered.length !== options.expectedCount) {
    throw new Error(
      `Expected ${ options.expectedCount } recipients after exclusions, got ${ filtered.length }`,
    );
  }

  const amountMars = computeAmountMars(filtered.length, options);

  return filtered.map((r) => ({
    line: r.line,
    address: r.address,
    amountMars,
  }));
}

export function allocationsToCsv(rows: AllocationRow[]): string {
  const lines = ['address,amount_mars'];
  for (const row of rows) {
    lines.push(`${ row.address },${ row.amountMars }`);
  }
  return `${ lines.join('\n') }\n`;
}

export function writeAllocationsCsv(outputPath: string, rows: AllocationRow[]): void {
  const dir = dirname(outputPath);
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, allocationsToCsv(rows), 'utf8');
}

export function loadRecipientsAndGenerate(
  inputPath: string,
  outputPath: string,
  options: GenerateOptions = {},
): { rows: AllocationRow[]; amountMars: string } {
  const content = readFileSync(inputPath, 'utf8');
  const recipients = parseRecipientsCsv(content);
  const rows = buildAllocations(recipients, options);
  writeAllocationsCsv(outputPath, rows);
  return { rows, amountMars: rows[0]?.amountMars ?? String(DEFAULT_AMOUNT_MARS) };
}
