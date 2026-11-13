import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import React from 'react';

import type { Address } from 'types/api/address';

import config from 'configs/app';
import { getCirculatingSupply, parseCoinSupply } from 'lib/addresses/circulatingSupply';
import useApiFetch from 'lib/api/useApiFetch';
import useApiQuery from 'lib/api/useApiQuery';

export default function useCirculatingSupply() {
  const apiFetch = useApiFetch();
  const excludedAddresses = config.UI.views.address.topAccounts.supplyExcludedAddresses;
  const decimals = config.chain.currency.decimals;

  const coinSupplyQuery = useApiQuery('stats_coin_supply', {
    queryParams: {
      module: 'stats',
      action: 'coinsupply',
    },
    queryOptions: {
      refetchOnMount: false,
    },
    logError: true,
  });

  const excludedBalancesQuery = useQuery<Array<string | null>>({
    queryKey: [ 'supply_excluded_balances', excludedAddresses ],
    queryFn: async() => {
      return Promise.all(excludedAddresses.map(async(hash) => {
        const address = await apiFetch<'address', Address>('address', {
          pathParams: { hash },
          logError: true,
        });
        if (!address || !('coin_balance' in address)) {
          throw new Error(`Failed to load supply-excluded address ${ hash }`);
        }
        return address.coin_balance;
      }));
    },
    enabled: excludedAddresses.length > 0,
    refetchOnMount: false,
  });

  const isLoading = coinSupplyQuery.isLoading || (excludedAddresses.length > 0 && excludedBalancesQuery.isLoading);
  const isError = coinSupplyQuery.isError || excludedBalancesQuery.isError;

  const circulatingSupply = React.useMemo(() => {
    if (isLoading || isError) {
      return null;
    }

    const excludedBalancesWei = excludedAddresses.length === 0 ?
      [] :
      (excludedBalancesQuery.data ?? []).map((balance) => new BigNumber(balance || 0));

    return getCirculatingSupply({
      coinSupply: parseCoinSupply(coinSupplyQuery.data),
      excludedBalancesWei,
      decimals,
    });
  }, [
    coinSupplyQuery.data,
    decimals,
    excludedAddresses.length,
    excludedBalancesQuery.data,
    isError,
    isLoading,
  ]);

  return {
    circulatingSupply,
    excludedAddresses,
    isError,
    isLoading,
  };
}
