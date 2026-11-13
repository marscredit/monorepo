import BigNumber from 'bignumber.js';

import { ndash } from 'lib/html-entities';

import { isSupplyExcludedAddress } from './parseSupplyExcludedAddresses';

/**
 * Parses Blockscout `/api?module=stats&action=coinsupply` payloads.
 * The explorer RPC endpoint returns DB-derived native supply in human (ether) units
 * as a JSON number, string, or `{ result }` wrapper — never market-data supply.
 */
export function parseCoinSupply(payload: unknown): BigNumber | null {
  if (payload == null || payload === '') {
    return null;
  }

  if (typeof payload === 'object') {
    if (!('result' in payload)) {
      return null;
    }
    return parseCoinSupply((payload as { result: unknown }).result);
  }

  const value = new BigNumber(payload as string | number);
  if (!value.isFinite() || value.lte(0)) {
    return null;
  }

  return value;
}

/**
 * Circulating supply in human units: coin supply minus excluded (burn) balances.
 * Excluded balances are wei (as returned by `/api/v2/addresses/:hash`).
 */
export function getCirculatingSupply({
  coinSupply,
  excludedBalancesWei,
  decimals,
}: {
  coinSupply: BigNumber | null;
  excludedBalancesWei: Array<BigNumber | null>;
  decimals: number;
}): BigNumber | null {
  if (!coinSupply || !coinSupply.isFinite() || coinSupply.lte(0)) {
    return null;
  }

  const validBalances: Array<BigNumber> = [];
  for (const balance of excludedBalancesWei) {
    if (balance === null || !balance.isFinite()) {
      return null;
    }
    validBalances.push(balance);
  }

  const divisor = new BigNumber(10).pow(decimals);
  const excluded = validBalances.reduce(
    (sum, balance) => sum.plus(balance.div(divisor)),
    new BigNumber(0),
  );

  const circulating = coinSupply.minus(excluded);
  if (!circulating.isFinite() || circulating.lte(0)) {
    return null;
  }

  return circulating;
}

export function formatAccountPercentage({
  hash,
  coinBalance,
  circulatingSupply,
  decimals,
  supplyExcludedAddresses,
}: {
  hash: string;
  coinBalance: string | null;
  circulatingSupply: BigNumber | null;
  decimals: number;
  supplyExcludedAddresses: Array<string>;
}): string {
  if (isSupplyExcludedAddress(hash, supplyExcludedAddresses)) {
    return 'Burned';
  }

  if (!circulatingSupply || circulatingSupply.lte(0)) {
    return ndash;
  }

  const balance = new BigNumber(coinBalance || 0).div(new BigNumber(10).pow(decimals));
  const percentage = balance.div(circulatingSupply).multipliedBy(100);

  if (!percentage.isFinite()) {
    return ndash;
  }

  return percentage.dp(8).toFormat() + '%';
}
