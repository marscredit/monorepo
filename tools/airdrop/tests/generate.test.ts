import { describe, expect, it } from 'vitest';
import { TREASURY_ADDRESS } from '../src/constants.js';
import {
  allocationsToCsv,
  buildAllocations,
  computeAmountMars,
  parseRecipientsCsv,
} from '../src/generate-allocations.js';

describe('parseRecipientsCsv', () => {
  it('parses address column from headered export', () => {
    const rows = parseRecipientsCsv(
      'address,balance_eth\n0x0000000000000000000000000000000000000001,100\n0x0000000000000000000000000000000000000002,50',
    );
    expect(rows).toHaveLength(2);
  });

  it('parses single-column list without header', () => {
    const rows = parseRecipientsCsv(
      '0x0000000000000000000000000000000000000001\n0x0000000000000000000000000000000000000002',
    );
    expect(rows).toHaveLength(2);
  });
});

describe('computeAmountMars', () => {
  it('splits 270M across 25000 wallets evenly', () => {
    expect(computeAmountMars(25_000, { totalMars: 270_000_000 })).toBe('10800');
  });

  it('splits 270M across 20000 wallets evenly', () => {
    expect(computeAmountMars(20_000, { totalMars: 270_000_000 })).toBe('13500');
  });

  it('rejects uneven splits', () => {
    expect(() => computeAmountMars(25_000, { totalMars: 270_000_001 })).toThrow(/does not divide evenly/);
  });
});

describe('buildAllocations', () => {
  it('excludes treasury and assigns equal amounts', () => {
    const recipients = parseRecipientsCsv(
      `address\n0x0000000000000000000000000000000000000001\n${ TREASURY_ADDRESS }`,
    );
    const rows = buildAllocations(recipients, {
      expectedCount: 1,
      amountMars: 10_800,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].amountMars).toBe('10800');
  });

  it('writes valid CSV lines', () => {
    const recipients = parseRecipientsCsv(
      'address\n0x0000000000000000000000000000000000000001',
    );
    const rows = buildAllocations(recipients, { expectedCount: 1, amountMars: 10800 });
    const csv = allocationsToCsv(rows);
    expect(csv).toContain('address,amount_mars');
    expect(csv).toContain('10800');
  });
});
