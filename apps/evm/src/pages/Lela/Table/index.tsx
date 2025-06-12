/** @jsxImportSource @emotion/react */
import { Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { useGetBalanceOf, useGetLegacyPool, useGetVenusVaiVaultDailyRate } from 'clients/api';
import { Table, type TableColumn, TokenIconWithSymbol } from 'components';
import { useGetVaiVaultContractAddress } from 'libs/contracts';
import { useGetToken } from 'libs/tokens';
import { useTranslation } from 'libs/translations';
import { useAccountAddress } from 'libs/wallet';
import type { RewardDistributorDistribution, Token } from 'types';
import {
  areTokensEqual,
  calculateApy,
  compareBigNumbers,
  convertMantissaToTokens,
  formatPercentageToReadableValue,
  formatTokensToReadableValue,
} from 'utilities';

import { useStyles } from '../styles';
import { lelaPoolData } from '../../../../data/lelaPoolData';

type TableAsset = {
  token: Token;
  xvsPerDay: BigNumber | undefined;
  xvsSupplyApy: BigNumber | undefined;
  xvsBorrowApy: BigNumber | undefined;
};

interface XvsTableProps {
  assets: TableAsset[];
  isFetchingAssets: boolean;
  lela: Token;
}

const XvsTableUi: React.FC<XvsTableProps> = ({ assets, isFetchingAssets, lela }) => {
  const { t } = useTranslation();
  const styles = useStyles();

  const columns: TableColumn<TableAsset>[] = useMemo(
    () => [
      {
        key: 'asset',
        label: t('lela.columns.asset'),
        selectOptionLabel: t('lela.columns.asset'),
        renderCell: ({ token }) => {
          return <TokenIconWithSymbol token={token} />
        },
      },
      {
        key: 'xvsPerDay',
        label: t('lela.columns.xvsPerDay'),
        selectOptionLabel: t('lela.columns.xvsPerDay'),
        align: 'right',
        renderCell: ({ xvsPerDay }) => (
          <Typography variant="small1" css={[styles.whiteText, styles.fontWeight400]}>
            {formatTokensToReadableValue({
              value: xvsPerDay,
              // value: BigNumber(0),
              token: lela,
            })}
          </Typography>
        ),
        sortRows: (rowA, rowB, direction) =>
          compareBigNumbers(rowA.xvsPerDay, rowB.xvsPerDay, direction),
      },
      {
        key: 'supplyXvsApy',
        label: t('lela.columns.supplyXvsApy'),
        selectOptionLabel: t('lela.columns.supplyXvsApy'),
        align: 'right',
        renderCell: ({ xvsSupplyApy }) => (
          <Typography variant="small1" css={[styles.whiteText, styles.fontWeight400]}>
            {formatPercentageToReadableValue(xvsSupplyApy)}
            {/* {'0%'} */}
          </Typography>
        ),
        sortRows: (rowA, rowB, direction) =>
          compareBigNumbers(rowA.xvsSupplyApy, rowB.xvsSupplyApy, direction),
      },
      {
        key: 'borrowXvsApy',
        label: t('lela.columns.borrowXvsApy'),
        selectOptionLabel: t('lela.columns.borrowXvsApy'),
        align: 'right',
        renderCell: ({ xvsBorrowApy }) => (
          <Typography variant="small1" css={[styles.whiteText, styles.fontWeight400]}>
            {formatPercentageToReadableValue(xvsBorrowApy)}
            {/* {'0%'} */}
          </Typography>
        ),
        sortRows: (rowA, rowB, direction) =>
          compareBigNumbers(rowA.xvsBorrowApy, rowB.xvsBorrowApy, direction),
      },
    ],
    [t, lela, styles.fontWeight400, styles.whiteText],
  );

  return (
    <Table
      data={assets}
      columns={columns}
      isFetching={isFetchingAssets}
      initialOrder={{
        orderBy: columns[1],
        orderDirection: 'desc',
      }}
      rowKeyExtractor={row =>
        `lela-table-row-${row.token.address}-${row.xvsBorrowApy}-${row.xvsPerDay}-${row.xvsSupplyApy}`
      }
      breakpoint="sm"
      css={styles.cardContentGrid}
    />
  );
};

const XvsTable: React.FC = () => {
  const { accountAddress } = useAccountAddress();
  const vai = useGetToken({
    symbol: 'VAI',
  });

  const lela = useGetToken({
    symbol: 'LELA',
  });

  // const { data: getLegacyPoolData, isLoading: isGetLegacyPoolLoading } = useGetLegacyPool({
  //   accountAddress,
  // });

  const { data: venusVaiVaultDailyRateData } = useGetVenusVaiVaultDailyRate();

  const vaiVaultContractAddress = useGetVaiVaultContractAddress();

  const { data: vaultVaiStakedData } = useGetBalanceOf(
    {
      token: vai!,
      accountAddress: vaiVaultContractAddress || '',
    },
    {
      enabled: !!vaiVaultContractAddress && !!vai,
    },
  );

  // const assetsWithVai = useMemo(() => {
  //   const allAssets: TableAsset[] = (getLegacyPoolData?.pool.assets || []).map(asset => {
  //     // Note: assets from the core pool only yield LELA, hence why we only take
  //     // the first distribution token in consideration (which will always be LELA
  //     // here)
  //     const supplyXvsDistribution = asset.supplyDistributions[0] as RewardDistributorDistribution;
  //     const borrowXvsDistribution = asset.borrowDistributions[0] as RewardDistributorDistribution;

  //     return {
  //       token: asset.leToken.underlyingToken,
  //       xvsPerDay: supplyXvsDistribution.dailyDistributedTokens.plus(
  //         borrowXvsDistribution.dailyDistributedTokens,
  //       ),
  //       xvsSupplyApy: asset.supplyDistributions[0].apyPercentage,
  //       xvsBorrowApy: asset.borrowDistributions[0].apyPercentage,
  //     };
  //   });

  //   const xvsAsset = (getLegacyPoolData?.pool.assets || []).find(asset =>
  //     areTokensEqual(asset.leToken.underlyingToken, lela!),
  //   );

  //   if (venusVaiVaultDailyRateData && vaultVaiStakedData && xvsAsset) {
  //     const vaiVaultDailyXvsRateTokens = convertMantissaToTokens({
  //       value: venusVaiVaultDailyRateData.dailyRateMantissa,
  //       token: lela,
  //     });

  //     const vaiVaultStakedTokens = convertMantissaToTokens({
  //       value: vaultVaiStakedData.balanceMantissa,
  //       token: vai,
  //     });

  //     const dailyRate = vaiVaultDailyXvsRateTokens
  //       .times(xvsAsset.tokenPriceCents.div(100))
  //       .div(vaiVaultStakedTokens);

  //     const vaiApy = calculateApy({ dailyRate });

  //     allAssets.unshift({
  //       token: vai!,
  //       xvsPerDay: vaiVaultDailyXvsRateTokens,
  //       xvsSupplyApy: vaiApy,
  //       xvsBorrowApy: undefined,
  //     });
  //   }

  //   return allAssets;
  // }, [getLegacyPoolData?.pool.assets, venusVaiVaultDailyRateData, vaultVaiStakedData, vai, lela]);

  // TODO: change `lela={lela!}` lela variable
  // @ts-ignore
  return <XvsTableUi assets={lelaPoolData} isFetchingAssets={false} lela={lela!} />;
};

export default XvsTable;
