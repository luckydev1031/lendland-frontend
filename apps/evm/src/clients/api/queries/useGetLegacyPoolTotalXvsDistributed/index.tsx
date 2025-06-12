import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { useGetLegacyPoolMarkets } from 'clients/api';
import { useGetToken } from 'libs/tokens';
import { convertTokensToMantissa } from 'utilities';

export interface UseGetLegacyPoolTotalXvsDistributedOutput {
  isLoading: boolean;
  data?: {
    totalXvsDistributedMantissa: BigNumber;
  };
}

// TODO: get from subgraph

const useGetLegacyPoolTotalXvsDistributed = (): UseGetLegacyPoolTotalXvsDistributedOutput => {
  const { data: getLegacyPoolMarketsData, isLoading: isGetMainAssetsLoading } =
    useGetLegacyPoolMarkets();

  const lela = useGetToken({
    symbol: 'LELA',
  });

  const totalXvsDistributedMantissa = useMemo(() => {
    const totalXvsDistributedTokens = getLegacyPoolMarketsData?.markets?.reduce(
      (acc, market) => acc.plus(market.totalXvsDistributedTokens),
      new BigNumber(0),
    );

    return (
      totalXvsDistributedTokens &&
      lela &&
      convertTokensToMantissa({
        value: totalXvsDistributedTokens,
        token: lela,
      })
    );
  }, [getLegacyPoolMarketsData?.markets, lela]);

  return {
    isLoading: isGetMainAssetsLoading,
    data: totalXvsDistributedMantissa && { totalXvsDistributedMantissa },
  };
};

export default useGetLegacyPoolTotalXvsDistributed;
