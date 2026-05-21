import { describe, expect, it } from 'vitest';
import { DEFAULT_AMOUNT_MARS, EXPECTED_ROW_COUNT, MAX_DISTRIBUTE_MARS, TREASURY_ADDRESS } from '../src/constants.js';
import {
  findDuplicateAddresses,
  formatMars,
  marsToWei,
  normalizeAddress,
  parseAllocationsCsv,
  sumAllocationMars,
  validateAllocationsStructure,
} from '../src/validate.js';

const VALID_ADDRESS_A = '0x0000000000000000000000000000000000000001';
const VALID_ADDRESS_B = '0x0000000000000000000000000000000000000002';

function makeRows(count: number, amount = String(DEFAULT_AMOUNT_MARS)) {
  const lines = ['address,amount_mars'];
  for (let i = 1; i <= count; i++) {
    const hex = i.toString(16).padStart(40, '0');
    lines.push(`0x${ hex },${ amount }`);
  }
  return parseAllocationsCsv(lines.join('\n'));
}

describe('parseAllocationsCsv', () => {
  it('parses headered CSV with amounts', () => {
    const rows = parseAllocationsCsv(
      `address,amount_mars\n${ VALID_ADDRESS_A },9600\n${ VALID_ADDRESS_B },100`,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].address).toBe(normalizeAddress(VALID_ADDRESS_A));
    expect(rows[0].amountMars).toBe('9600');
    expect(rows[1].amountMars).toBe('100');
  });

  it('uses default amount when column missing', () => {
    const rows = parseAllocationsCsv(`address,amount_mars\n${ VALID_ADDRESS_A }`, '5000');
    expect(rows[0].amountMars).toBe('5000');
  });

  it('rejects invalid addresses', () => {
    expect(() => parseAllocationsCsv('address,amount_mars\nnot-an-address,9600')).toThrow(
      /invalid address/i,
    );
  });
});

describe('marsToWei', () => {
  it('converts whole MARS to 18-decimal wei', () => {
    expect(marsToWei('9600')).toBe(9600n * 10n ** 18n);
  });

  it('sums allocations to expected total for equal split', () => {
    const rows = makeRows(100, '9600');
    expect(sumAllocationMars(rows)).toBe(960_000n);
  });
});

describe('validateAllocationsStructure', () => {
  it('skips row count check by default', () => {
    const rows = makeRows(10);
    expect(() => validateAllocationsStructure(rows)).not.toThrow();
  });

  it('enforces row count when expectedRowCount is set', () => {
    const rows = makeRows(10);
    expect(() => validateAllocationsStructure(rows, { expectedRowCount: 25_000 })).toThrow(
      /Expected 25000 rows/,
    );
    expect(() => validateAllocationsStructure(rows, { expectedRowCount: 10 })).not.toThrow();
  });

  it('rejects totals above max distribute', () => {
    const rows = makeRows(EXPECTED_ROW_COUNT, String(DEFAULT_AMOUNT_MARS + 1));
    expect(() => validateAllocationsStructure(rows, { allowPartial: true })).toThrow(
      /exceeds max/,
    );
  });

  it('accepts full 25k equal allocation within budget', () => {
    const rows = makeRows(EXPECTED_ROW_COUNT, String(DEFAULT_AMOUNT_MARS));
    const result = validateAllocationsStructure(rows, { allowPartial: true });
    expect(result.totalMars).toBe(BigInt(MAX_DISTRIBUTE_MARS));
  });

  it('detects duplicate addresses', () => {
    const csv = `address,amount_mars\n${ VALID_ADDRESS_A },9600\n${ VALID_ADDRESS_A },9600`;
    const rows = parseAllocationsCsv(csv);
    expect(findDuplicateAddresses(rows)).toEqual([normalizeAddress(VALID_ADDRESS_A)]);
    expect(() => validateAllocationsStructure(rows, { allowPartial: true })).toThrow(/Duplicate/);
  });

  it('rejects treasury as recipient', () => {
    const csv = `address,amount_mars\n${ TREASURY_ADDRESS },9600`;
    const rows = parseAllocationsCsv(csv);
    expect(() => validateAllocationsStructure(rows, { allowPartial: true })).toThrow(/treasury/i);
  });
});

describe('formatMars', () => {
  it('formats whole MARS from wei', () => {
    expect(formatMars(marsToWei('9600'))).toBe('9600');
  });
});
