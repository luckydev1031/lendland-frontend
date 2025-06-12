import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import {
  useGetHypotheticalPrimeApys,
  useGetPrimeStatus,
  useGetXvsVaultUserInfo,
} from 'clients/api';
import { useGetToken } from 'libs/tokens';
import { useAccountAddress } from 'libs/wallet';
import type { Asset, TokenAction } from 'types';
import { convertTokensToMantissa } from 'utilities';

export interface UseGetHypotheticalUserPrimeApysInput {
  asset: Asset;
  action: TokenAction;
  toTokenAmountTokens: BigNumber;
}

export const useGetHypotheticalUserPrimeApys = ({
  asset,
  action,
  toTokenAmountTokens,
}: UseGetHypotheticalUserPrimeApysInput) => {
  const { accountAddress } = useAccountAddress();
  const lela = useGetToken({
    symbol: 'LELA',
  });

  const { data: getPrimeStatusData } = useGetPrimeStatus(
    {
      accountAddress: accountAddress || '',
    },
    {
      enabled: !!accountAddress,
    },
  );
  const xvsVaultPoolIndex = getPrimeStatusData?.xvsVaultPoolId;

  const { data: getXvsVaultUserInfoData } = useGetXvsVaultUserInfo(
    {
      poolIndex: xvsVaultPoolIndex || 0,
      rewardTokenAddress: lela?.address || '',
      accountAddress: accountAddress || '',
    },
    {
      enabled: !!accountAddress && !!lela && typeof xvsVaultPoolIndex === 'number',
    },
  );
  const userXvsStakedMantissa = getXvsVaultUserInfoData?.stakedAmountMantissa;

  const shouldFetchHypotheticalUserPrimeApy = asset.borrowDistributions
    .concat(asset.supplyDistributions)
    .some(distribution => distribution.type === 'prime');

  const { userBorrowBalanceMantissa, userSupplyBalanceMantissa } = useMemo(() => {
    let hypotheticalUserBorrowBalanceTokens = asset.userBorrowBalanceTokens;
    let hypotheticalUserSupplyBalanceTokens = asset.userSupplyBalanceTokens;

    if (action === 'borrow') {
      hypotheticalUserBorrowBalanceTokens = asset.userBorrowBalanceTokens.plus(toTokenAmountTokens);
    } else if (action === 'repay') {
      hypotheticalUserBorrowBalanceTokens =
        asset.userBorrowBalanceTokens.minus(toTokenAmountTokens);
    } else if (action === 'supply') {
      hypotheticalUserSupplyBalanceTokens = asset.userSupplyBalanceTokens.plus(toTokenAmountTokens);
    } else if (action === 'withdraw') {
      hypotheticalUserSupplyBalanceTokens =
        asset.userSupplyBalanceTokens.minus(toTokenAmountTokens);
    }

    return {
      userBorrowBalanceMantissa: convertTokensToMantissa({
        value: hypotheticalUserBorrowBalanceTokens,
        token: asset.leToken.underlyingToken,
      }),
      userSupplyBalanceMantissa: convertTokensToMantissa({
        value: hypotheticalUserSupplyBalanceTokens,
        token: asset.leToken.underlyingToken,
      }),
    };
  }, [
    asset.leToken.underlyingToken,
    asset.userBorrowBalanceTokens,
    asset.userSupplyBalanceTokens,
    action,
    toTokenAmountTokens,
  ]);

  const { data: getHypotheticalPrimeApysData } = useGetHypotheticalPrimeApys(
    {
      accountAddress,
      vTokenAddress: asset.leToken.address,
      userBorrowBalanceMantissa,
      userSupplyBalanceMantissa,
      userXvsStakedMantissa: userXvsStakedMantissa || new BigNumber(0),
    },
    {
      enabled: shouldFetchHypotheticalUserPrimeApy && !!userXvsStakedMantissa,
      keepPreviousData: true,
    },
  );

  if (toTokenAmountTokens.isEqualTo(0)) {
    return undefined;
  }

  return {
    borrowApy: getHypotheticalPrimeApysData?.borrowApyPercentage,
    supplyApy: getHypotheticalPrimeApysData?.supplyApyPercentage,
  };
};
