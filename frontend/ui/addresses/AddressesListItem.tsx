import { Flex, HStack, Skeleton } from '@chakra-ui/react';
import BigNumber from 'bignumber.js';
import React from 'react';

import type { AddressesItem } from 'types/api/addresses';

import config from 'configs/app';
import { formatAccountPercentage } from 'lib/addresses/circulatingSupply';
import { currencyUnits } from 'lib/units';
import Tag from 'ui/shared/chakra/Tag';
import AddressEntity from 'ui/shared/entities/address/AddressEntity';
import ListItemMobile from 'ui/shared/ListItemMobile/ListItemMobile';

type Props = {
  item: AddressesItem;
  index: number;
  circulatingSupply: BigNumber | null;
  supplyExcludedAddresses: Array<string>;
  isLoading?: boolean;
};

const AddressesListItem = ({
  item,
  index,
  circulatingSupply,
  supplyExcludedAddresses,
  isLoading,
}: Props) => {

  const addressBalance = BigNumber(item.coin_balance || 0).div(BigNumber(10 ** config.chain.currency.decimals));
  const percentageLabel = formatAccountPercentage({
    hash: item.hash,
    coinBalance: item.coin_balance,
    circulatingSupply,
    decimals: config.chain.currency.decimals,
    supplyExcludedAddresses,
  });

  return (
    <ListItemMobile rowGap={ 3 }>
      <Flex alignItems="center" justifyContent="space-between" w="100%">
        <AddressEntity
          address={ item }
          isLoading={ isLoading }
          fontWeight={ 700 }
          mr={ 2 }
          truncation="constant"
        />
        <Skeleton isLoaded={ !isLoading } fontSize="sm" ml="auto" minW={ 6 } color="text_secondary">
          <span>{ index }</span>
        </Skeleton>
      </Flex>
      { item.public_tags !== null && item.public_tags.length > 0 && item.public_tags.map(tag => (
        <Tag key={ tag.label } isLoading={ isLoading }>{ tag.display_name }</Tag>
      )) }
      <HStack spacing={ 3 } maxW="100%" alignItems="flex-start">
        <Skeleton isLoaded={ !isLoading } fontSize="sm" fontWeight={ 500 } flexShrink={ 0 }>{ `Balance ${ currencyUnits.ether }` }</Skeleton>
        <Skeleton isLoaded={ !isLoading } fontSize="sm" color="text_secondary" minW="0" whiteSpace="pre-wrap">
          <span>{ addressBalance.dp(8).toFormat() }</span>
        </Skeleton>
      </HStack>
      <HStack spacing={ 3 }>
        <Skeleton isLoaded={ !isLoading } fontSize="sm" fontWeight={ 500 }>Percentage</Skeleton>
        <Skeleton isLoaded={ !isLoading } fontSize="sm" color="text_secondary">
          <span>{ percentageLabel }</span>
        </Skeleton>
      </HStack>
      <HStack spacing={ 3 }>
        <Skeleton isLoaded={ !isLoading } fontSize="sm" fontWeight={ 500 }>Txn count</Skeleton>
        <Skeleton isLoaded={ !isLoading } fontSize="sm" color="text_secondary">
          <span>{ Number(item.transaction_count).toLocaleString() }</span>
        </Skeleton>
      </HStack>
    </ListItemMobile>
  );
};

export default React.memo(AddressesListItem);
