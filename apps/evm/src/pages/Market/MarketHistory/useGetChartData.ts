import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { useGetMarketHistory } from 'clients/api';
import type { ApyChartProps } from 'components/charts/ApyChart';
import type { LeToken } from 'types';

const useGetChartData = ({ leToken }: { leToken: LeToken }) => {
  const {
    isLoading,
    data: marketSnapshotsData = {
      marketSnapshots: [],
    },
  } = useGetMarketHistory({
    leToken,
  });

  const data = useMemo(() => {
    const supplyChartData: ApyChartProps['data'] = [];
    const borrowChartData: ApyChartProps['data'] = [];

    [...marketSnapshotsData.marketSnapshots]
      // Snapshots are already reversed, due to the negative slice
      .forEach(marketSnapshot => {
        const timestampMs = marketSnapshot.blockTimestamp * 1000;

        supplyChartData.push({
          // apyPercentage: +marketSnapshot.supplyApy,
          apyPercentage: 0,
          timestampMs,
          balanceCents: new BigNumber(0),
          // balanceCents: new BigNumber(marketSnapshot.totalSupplyCents),
        });

        borrowChartData.push({
          // apyPercentage: +marketSnapshot.borrowApy,
          apyPercentage: 0,
          timestampMs,
          // balanceCents: new BigNumber(marketSnapshot.totalBorrowCents),
          balanceCents: new BigNumber(0),
        });
      });

    return { supplyChartData, borrowChartData };
  }, [marketSnapshotsData]);

  return {
    isLoading,
    data,
  };
};

export default useGetChartData;
