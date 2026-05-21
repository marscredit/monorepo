import type { AddressesItem } from 'types/api/addresses';

export function filterTopAccountsItems(
  items: Array<AddressesItem> | undefined,
  excludedAddresses: Array<string>,
): Array<AddressesItem> | undefined {
  if (items === undefined) {
    return undefined;
  }

  if (!excludedAddresses.length) {
    return items;
  }

  const excluded = new Set(excludedAddresses.map((address) => address.toLowerCase()));

  return items.filter((item) => !excluded.has(item.hash.toLowerCase()));
}
