import React from 'react';

import type { AddressesResponse } from 'types/api/addresses';

import { DEFAULT_SUPPLY_EXCLUDED_ADDRESS } from 'lib/addresses/parseSupplyExcludedAddresses';
import * as addressMocks from 'mocks/address/address';
import { test, expect } from 'playwright/lib';

import Accounts from './Accounts';

const addresses: AddressesResponse = {
  items: [
    {
      ...addressMocks.withName,
      transaction_count: '1',
      coin_balance: '12345678901234567890000',
    },
    {
      ...addressMocks.token,
      transaction_count: '109123890123',
      coin_balance: '22222345678901234567890000',
      ens_domain_name: null,
    },
    {
      ...addressMocks.withoutName,
      transaction_count: '11',
      coin_balance: '1000000000000000000',
    },
    {
      ...addressMocks.eoa,
      transaction_count: '420',
      coin_balance: '123456',
    },
  ],
  total_supply: '25222000',
  next_page_params: null,
};

test('base view +@mobile +@dark-mode', async({ render, mockTextAd, mockApiResponse }) => {
  await mockTextAd();
  await mockApiResponse('addresses', addresses);
  await mockApiResponse('stats_coin_supply', 25222000, {
    queryParams: { module: 'stats', action: 'coinsupply' },
  });
  await mockApiResponse('address', {
    ...addressMocks.eoa,
    hash: DEFAULT_SUPPLY_EXCLUDED_ADDRESS,
    coin_balance: '0',
  }, { pathParams: { hash: DEFAULT_SUPPLY_EXCLUDED_ADDRESS } });
  const component = await render(<Accounts/>);
  await expect(component).toHaveScreenshot();
});
