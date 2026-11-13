export const DEFAULT_SUPPLY_EXCLUDED_ADDRESS = '0x000000000000000000000000000000000000dead';

/**
 * Parses NEXT_PUBLIC_SUPPLY_EXCLUDED_ADDRESSES (comma-separated).
 * Defaults to the canonical burn address when unset or empty.
 */
export function parseSupplyExcludedAddresses(value: string | undefined): Array<string> {
  if (!value || value.trim() === '') {
    return [ DEFAULT_SUPPLY_EXCLUDED_ADDRESS ];
  }

  return value
    .split(',')
    .map((address) => address.trim().toLowerCase())
    .filter((address) => address.length > 0);
}

export function isSupplyExcludedAddress(hash: string, excludedAddresses: Array<string>): boolean {
  const normalized = hash.toLowerCase();
  return excludedAddresses.some((address) => address.toLowerCase() === normalized);
}
