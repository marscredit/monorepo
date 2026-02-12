import BigNumber from 'bignumber.js';

import type { AddressesItem } from 'types/api/addresses';

/**
 * Computes total supply in human units from the sum of displayed items' coin_balance.
 * Used for Top Accounts percentage when API total_supply is unreliable (e.g. new chain).
 */
export function getTotalSupplyFromItems(items: Array<AddressesItem> | undefined, decimals: number): BigNumber {
  if (!items?.length) return new BigNumber(0);
  const rawTotal = items.reduce(
    (sum, item) => sum.plus(BigNumber(item.coin_balance || 0)),
    new BigNumber(0),
  );
  return rawTotal.div(BigNumber(10 ** decimals));
}
