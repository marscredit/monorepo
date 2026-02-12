import BigNumber from 'bignumber.js';

import { getTotalSupplyFromItems } from './totalSupplyFromItems';

describe('getTotalSupplyFromItems', () => {
  const decimals = 18;

  it('returns zero when items is undefined', () => {
    expect(getTotalSupplyFromItems(undefined, decimals).eq(0)).toBe(true);
  });

  it('returns zero when items is empty', () => {
    expect(getTotalSupplyFromItems([], decimals).eq(0)).toBe(true);
  });

  it('sums coin_balance and converts to human units', () => {
    const items = [
      { coin_balance: '1000000000000000000', hash: '0x1', transaction_count: '0' } as any,
      { coin_balance: '2000000000000000000', hash: '0x2', transaction_count: '0' } as any,
      { coin_balance: '500000000000000000', hash: '0x3', transaction_count: '0' } as any,
    ];
    const total = getTotalSupplyFromItems(items, decimals);
    expect(total.eq(new BigNumber(3.5))).toBe(true);
  });

  it('treats null coin_balance as zero', () => {
    const items = [
      { coin_balance: '1000000000000000000', hash: '0x1', transaction_count: '0' } as any,
      { coin_balance: null, hash: '0x2', transaction_count: '0' } as any,
    ];
    const total = getTotalSupplyFromItems(items, decimals);
    expect(total.eq(new BigNumber(1))).toBe(true);
  });

  it('percentages of items sum to 100 when using this total', () => {
    const items = [
      { coin_balance: '273449899999947600000000000', hash: '0x1', transaction_count: '0' } as any,
      { coin_balance: '30100000000000000000000000', hash: '0x2', transaction_count: '0' } as any,
      { coin_balance: '1773902312500000000000000', hash: '0x3', transaction_count: '0' } as any,
    ];
    const total = getTotalSupplyFromItems(items, decimals);
    const b1 = new BigNumber(items[0].coin_balance!).div(10 ** decimals);
    const b2 = new BigNumber(items[1].coin_balance!).div(10 ** decimals);
    const b3 = new BigNumber(items[2].coin_balance!).div(10 ** decimals);
    const p1 = b1.div(total).multipliedBy(100).dp(8).toNumber();
    const p2 = b2.div(total).multipliedBy(100).dp(8).toNumber();
    const p3 = b3.div(total).multipliedBy(100).dp(8).toNumber();
    expect(p1 + p2 + p3).toBeCloseTo(100, 5);
  });
});
