import type { AddressesItem } from 'types/api/addresses';

import { filterTopAccountsItems } from './filterTopAccountsItems';
import { getTotalSupplyFromItems } from './totalSupplyFromItems';

describe('filterTopAccountsItems', () => {
  const burnAddress = '0x000000000000000000000000000000000000dEaD';
  const holderAddress = '0x6039E53688Da87EBF30B0C84d22FCd6707b0C564';

  const items: Array<AddressesItem> = [
    { hash: burnAddress, coin_balance: '47000006500000000000000000', transaction_count: '0' } as AddressesItem,
    { hash: holderAddress, coin_balance: '264771667014157250000000000', transaction_count: '24' } as AddressesItem,
  ];

  it('returns undefined when items is undefined', () => {
    expect(filterTopAccountsItems(undefined, [ burnAddress ])).toBeUndefined();
  });

  it('returns all items when excluded list is empty', () => {
    expect(filterTopAccountsItems([ ...items ], [])).toEqual([ ...items ]);
  });

  it('filters excluded addresses case-insensitively', () => {
    const filtered = filterTopAccountsItems([ ...items ], [ burnAddress.toLowerCase() ]);

    expect(filtered).toEqual([ items[1] ]);
  });

  it('omits excluded items from total supply calculation', () => {
    const filtered = filterTopAccountsItems([ ...items ], [ burnAddress ]);
    const totalSupply = getTotalSupplyFromItems(filtered, 18);
    const holderBalance = Number(items[1].coin_balance) / 10 ** 18;

    expect(totalSupply.toNumber()).toBeCloseTo(holderBalance, 8);
  });
});
