import BigNumber from 'bignumber.js';

import { ndash } from 'lib/html-entities';

import { formatAccountPercentage, getCirculatingSupply, parseCoinSupply } from './circulatingSupply';
import { DEFAULT_SUPPLY_EXCLUDED_ADDRESS } from './parseSupplyExcludedAddresses';

const DECIMALS = 18;
const WEI = new BigNumber(10).pow(DECIMALS);
const BURN = '0x000000000000000000000000000000000000dEaD';
const TOP_HOLDER = '0xAb686a2dEFb2C108D15aC5471573557ef5382A80E8';

function weiFromEther(ether: string | number): BigNumber {
  return new BigNumber(ether).times(WEI);
}

describe('parseCoinSupply', () => {
  it('parses a JSON number from the coinsupply RPC endpoint', () => {
    expect(parseCoinSupply(416870000)?.toNumber()).toBe(416870000);
  });

  it('parses a numeric string', () => {
    expect(parseCoinSupply('416870000.5')?.toString()).toBe('416870000.5');
  });

  it('parses a { result } wrapper', () => {
    expect(parseCoinSupply({ result: '416870000' })?.toNumber()).toBe(416870000);
  });

  it('returns null for invalid payloads', () => {
    expect(parseCoinSupply(undefined)).toBeNull();
    expect(parseCoinSupply(null)).toBeNull();
    expect(parseCoinSupply('')).toBeNull();
    expect(parseCoinSupply('not-a-number')).toBeNull();
    expect(parseCoinSupply(0)).toBeNull();
    expect(parseCoinSupply(-1)).toBeNull();
    expect(parseCoinSupply({ message: 'OK' })).toBeNull();
  });
});

describe('getCirculatingSupply', () => {
  it('subtracts burn balances (wei) from DB coin supply (ether)', () => {
    const coinSupply = parseCoinSupply(416870000);
    const circulating = getCirculatingSupply({
      coinSupply,
      excludedBalancesWei: [ weiFromEther(100_000_000) ],
      decimals: DECIMALS,
    });

    expect(circulating?.toNumber()).toBe(316870000);
  });

  it('returns null when coin supply is missing or excluded balances failed to load', () => {
    expect(getCirculatingSupply({
      coinSupply: null,
      excludedBalancesWei: [ weiFromEther(1) ],
      decimals: DECIMALS,
    })).toBeNull();

    expect(getCirculatingSupply({
      coinSupply: new BigNumber(100),
      excludedBalancesWei: [ null ],
      decimals: DECIMALS,
    })).toBeNull();
  });

  it('returns null when excluded balances exceed supply', () => {
    expect(getCirculatingSupply({
      coinSupply: new BigNumber(10),
      excludedBalancesWei: [ weiFromEther(11) ],
      decimals: DECIMALS,
    })).toBeNull();
  });
});

describe('formatAccountPercentage', () => {
  const circulatingSupply = new BigNumber(316_870_000);
  const excluded = [ DEFAULT_SUPPLY_EXCLUDED_ADDRESS ];

  it('shows ~10.95% for the top holder against circulating supply excluding burn', () => {
    const label = formatAccountPercentage({
      hash: TOP_HOLDER,
      coinBalance: weiFromEther(34_688_665).toFixed(0),
      circulatingSupply,
      decimals: DECIMALS,
      supplyExcludedAddresses: excluded,
    });

    expect(label.endsWith('%')).toBe(true);
    expect(Number.parseFloat(label)).toBeCloseTo(10.95, 2);
  });

  it('labels the burn address as Burned instead of a percentage', () => {
    expect(formatAccountPercentage({
      hash: BURN,
      coinBalance: weiFromEther(100_000_000).toFixed(0),
      circulatingSupply,
      decimals: DECIMALS,
      supplyExcludedAddresses: excluded,
    })).toBe('Burned');
  });

  it('shows a dash when circulating supply is unavailable (never NaN)', () => {
    expect(formatAccountPercentage({
      hash: TOP_HOLDER,
      coinBalance: weiFromEther(34_688_665).toFixed(0),
      circulatingSupply: null,
      decimals: DECIMALS,
      supplyExcludedAddresses: excluded,
    })).toBe(ndash);

    expect(formatAccountPercentage({
      hash: TOP_HOLDER,
      coinBalance: 'not-a-number',
      circulatingSupply,
      decimals: DECIMALS,
      supplyExcludedAddresses: excluded,
    })).toBe(ndash);
  });
});
