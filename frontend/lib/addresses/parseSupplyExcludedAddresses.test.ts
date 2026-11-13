import { DEFAULT_SUPPLY_EXCLUDED_ADDRESS, isSupplyExcludedAddress, parseSupplyExcludedAddresses } from './parseSupplyExcludedAddresses';

describe('parseSupplyExcludedAddresses', () => {
  it('defaults to the dEaD burn address when unset', () => {
    expect(parseSupplyExcludedAddresses(undefined)).toEqual([ DEFAULT_SUPPLY_EXCLUDED_ADDRESS ]);
  });

  it('defaults to the dEaD burn address when empty', () => {
    expect(parseSupplyExcludedAddresses('')).toEqual([ DEFAULT_SUPPLY_EXCLUDED_ADDRESS ]);
    expect(parseSupplyExcludedAddresses('   ')).toEqual([ DEFAULT_SUPPLY_EXCLUDED_ADDRESS ]);
  });

  it('parses comma-separated addresses and lowercases them', () => {
    expect(parseSupplyExcludedAddresses(
      '0x000000000000000000000000000000000000dEaD, 0xAb686a2dEFb2C108D15AC5471573557eF53880E8 ',
    )).toEqual([
      '0x000000000000000000000000000000000000dead',
      '0xab686a2defb2c108d15ac5471573557ef53880e8',
    ]);
  });
});

describe('isSupplyExcludedAddress', () => {
  const excluded = [ '0x000000000000000000000000000000000000dead' ];

  it('matches excluded addresses case-insensitively', () => {
    expect(isSupplyExcludedAddress('0x000000000000000000000000000000000000dEaD', excluded)).toBe(true);
    expect(isSupplyExcludedAddress('0xAb68Ab68Ab68Ab68Ab68Ab68Ab68Ab68Ab6880E8', excluded)).toBe(false);
  });
});
