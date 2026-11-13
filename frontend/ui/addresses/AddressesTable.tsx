import { Table, Tbody, Tr, Th } from '@chakra-ui/react';
import type BigNumber from 'bignumber.js';
import React from 'react';

import type { AddressesItem } from 'types/api/addresses';

import { currencyUnits } from 'lib/units';
import { default as Thead } from 'ui/shared/TheadSticky';

import AddressesTableItem from './AddressesTableItem';

interface Props {
  items: Array<AddressesItem>;
  circulatingSupply: BigNumber | null;
  supplyExcludedAddresses: Array<string>;
  pageStartIndex: number;
  top: number;
  isLoading?: boolean;
}

const AddressesTable = ({
  items,
  circulatingSupply,
  supplyExcludedAddresses,
  pageStartIndex,
  top,
  isLoading,
}: Props) => {
  return (
    <Table>
      <Thead top={ top }>
        <Tr>
          <Th width="64px">Rank</Th>
          <Th width="50%">Address</Th>
          <Th width="20%" isNumeric>{ `Balance ${ currencyUnits.ether }` }</Th>
          <Th width="15%" isNumeric>Percentage</Th>
          <Th width="15%" isNumeric>Txn count</Th>
        </Tr>
      </Thead>
      <Tbody>
        { items.map((item, index) => (
          <AddressesTableItem
            key={ item.hash + (isLoading ? index : '') }
            item={ item }
            circulatingSupply={ circulatingSupply }
            supplyExcludedAddresses={ supplyExcludedAddresses }
            index={ pageStartIndex + index }
            isLoading={ isLoading }
          />
        )) }
      </Tbody>
    </Table>
  );
};

export default AddressesTable;
