/** @jsxImportSource @emotion/react */
import { routes } from 'constants/routing';
import { MarketTable } from 'containers/MarketTable';
import { useGetChainMetadata } from 'hooks/useGetChainMetadata';
import { useMemo } from 'react';
import type { Asset, Pool } from 'types';
import { areAddressesEqual } from 'utilities';
import { poolAssets } from '../../../../data/dashboardData';

export interface TableProps {
  pool: Pool;
  isPoolPage: boolean
}

export const Table: React.FC<TableProps> = ({ pool, isPoolPage }:TableProps) => {
  const { corePoolComptrollerContractAddress } = useGetChainMetadata();

  const getRowHref = (row: Asset) => {
    if (areAddressesEqual(pool.comptrollerAddress, corePoolComptrollerContractAddress)) {
      return routes.corePoolMarket.path.replace(':vTokenAddress', row.leToken.address);
    }

    return routes.isolatedPoolMarket.path
      .replace(':poolComptrollerAddress', pool.comptrollerAddress)
      .replace(':vTokenAddress', row.leToken.address);
  };


  return (
    <MarketTable
      getRowHref={getRowHref}
      pools={[pool]}
      isPoolPage={isPoolPage}
      breakpoint="xl"
      columns={[
        'asset',
        'supplyBalance',
        'labeledSupplyApyLtv',
        'borrowBalance',
        'labeledBorrowApy',
        'liquidity',
        'price',
      ]}
      initialOrder={{
        orderBy: 'labeledSupplyApyLtv',
        orderDirection: 'desc',
      }}
    />
  );
};

export default Table;
