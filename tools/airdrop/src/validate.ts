import { readFileSync } from 'node:fs';
import { getAddress, isAddress, JsonRpcProvider, parseEther } from 'ethers';
import {
  DEFAULT_AMOUNT_MARS,
  EXPECTED_CHAIN_ID,
  MAX_DISTRIBUTE_MARS,
  TREASURY_ADDRESS,
} from './constants.js';

export type AllocationRow = {
  line: number;
  address: string;
  amountMars: string;
};

export type ValidateOptions = {
  defaultAmountMars?: string;
  expectedRowCount?: number;
  allowPartial?: boolean;
  maxDistributeMars?: number;
  treasuryAddress?: string;
  rpcUrl?: string;
  expectedChainId?: number;
  skipOnChainChecks?: boolean;
};

export type ValidateResult = {
  rows: AllocationRow[];
  totalMars: bigint;
  totalWei: bigint;
  duplicateAddresses: string[];
};

export function parseAllocationsCsv(
  content: string,
  defaultAmountMars: string = String(DEFAULT_AMOUNT_MARS),
): AllocationRow[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error('CSV is empty');
  }

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('address');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    throw new Error('CSV has no data rows');
  }

  const rows: AllocationRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = hasHeader ? i + 2 : i + 1;
    const parts = splitCsvLine(dataLines[i]);
    if (parts.length === 0) continue;

    const rawAddress = parts[0]?.trim();
    if (!rawAddress) {
      throw new Error(`Line ${ lineNum }: missing address`);
    }

    const amountRaw = parts[1]?.trim() || defaultAmountMars;
    if (!amountRaw || Number.isNaN(Number(amountRaw)) || Number(amountRaw) <= 0) {
      throw new Error(`Line ${ lineNum }: invalid amount_mars "${ amountRaw }"`);
    }

    rows.push({
      line: lineNum,
      address: normalizeAddress(rawAddress, lineNum),
      amountMars: amountRaw,
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

export function normalizeAddress(raw: string, line?: number): string {
  const label = line !== undefined ? `Line ${ line }` : 'Address';
  if (!isAddress(raw)) {
    throw new Error(`${ label }: invalid address "${ raw }"`);
  }
  return getAddress(raw);
}

export function marsToWei(amountMars: string): bigint {
  return parseEther(amountMars);
}

export function sumAllocationWei(rows: AllocationRow[]): bigint {
  let total = 0n;
  for (const row of rows) {
    total += marsToWei(row.amountMars);
  }
  return total;
}

export function sumAllocationMars(rows: AllocationRow[]): bigint {
  return sumAllocationWei(rows) / 10n ** 18n;
}

export function findDuplicateAddresses(rows: AllocationRow[]): string[] {
  const seen = new Map<string, number>();
  const dupes: string[] = [];

  for (const row of rows) {
    const key = row.address.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) dupes.push(row.address);
  }

  return dupes;
}

export function validateAllocationsStructure(
  rows: AllocationRow[],
  options: ValidateOptions = {},
): ValidateResult {
  const maxDistributeMars = options.maxDistributeMars ?? MAX_DISTRIBUTE_MARS;
  const treasuryAddress = options.treasuryAddress ?? TREASURY_ADDRESS;

  const duplicateAddresses = findDuplicateAddresses(rows);
  if (duplicateAddresses.length > 0) {
    throw new Error(
      `Duplicate addresses in CSV (${ duplicateAddresses.length }): ${ duplicateAddresses.slice(0, 5).join(', ') }${ duplicateAddresses.length > 5 ? '...' : '' }`,
    );
  }

  const expectedRowCount = options.expectedRowCount;
  const enforceRowCount =
    expectedRowCount !== undefined && !(options.allowPartial ?? false);

  if (enforceRowCount && rows.length !== expectedRowCount) {
    throw new Error(
      `Expected ${ expectedRowCount } rows, got ${ rows.length }. Use --allow-partial to override.`,
    );
  }

  const totalWei = sumAllocationWei(rows);
  const totalMars = totalWei / 10n ** 18n;
  const maxWei = marsToWei(String(maxDistributeMars));

  if (totalWei > maxWei) {
    throw new Error(
      `Total allocation ${ totalMars.toString() } MARS exceeds max ${ maxDistributeMars } MARS`,
    );
  }

  for (const row of rows) {
    if (row.address.toLowerCase() === treasuryAddress.toLowerCase()) {
      throw new Error(`Line ${ row.line }: cannot airdrop to treasury address`);
    }
  }

  return { rows, totalMars, totalWei, duplicateAddresses };
}

export async function validateOnChain(
  totalWei: bigint,
  options: ValidateOptions = {},
): Promise<{ treasuryBalanceWei: bigint; chainId: number }> {
  const rpcUrl = options.rpcUrl ?? process.env.RPC_URL ?? 'https://rpc.marscredit.xyz';
  const treasuryAddress = options.treasuryAddress ?? TREASURY_ADDRESS;
  const expectedChainId = options.expectedChainId ?? EXPECTED_CHAIN_ID;

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (chainId !== expectedChainId) {
    throw new Error(`RPC chainId ${ chainId } != expected ${ expectedChainId }`);
  }

  const treasuryBalanceWei = await provider.getBalance(treasuryAddress);
  if (treasuryBalanceWei < totalWei) {
    const need = totalWei - treasuryBalanceWei;
    throw new Error(
      `Treasury ${ treasuryAddress } balance too low: have ${ formatMars(treasuryBalanceWei) } MARS, need ${ formatMars(totalWei) } MARS (short ${ formatMars(need) } MARS plus gas)`,
    );
  }

  return { treasuryBalanceWei, chainId };
}

export function formatMars(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (frac === 0n) return whole.toString();
  return `${ whole }.${ frac.toString().padStart(18, '0').replace(/0+$/, '') }`;
}

export async function loadAndValidateAllocations(
  csvPath: string,
  options: ValidateOptions = {},
): Promise<ValidateResult & { treasuryBalanceWei?: bigint; chainId?: number }> {
  const content = readFileSync(csvPath, 'utf8');
  const defaultAmountMars = options.defaultAmountMars ?? String(DEFAULT_AMOUNT_MARS);
  const rows = parseAllocationsCsv(content, defaultAmountMars);
  const result = validateAllocationsStructure(rows, options);

  if (!options.skipOnChainChecks) {
    const onChain = await validateOnChain(result.totalWei, options);
    return { ...result, ...onChain };
  }

  return result;
}
