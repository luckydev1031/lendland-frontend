import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import type { QueryObserverOptions } from 'react-query';

import {
  type GetHypotheticalPrimeApysOutput,
  useGetHypotheticalPrimeApys,
  useGetPrimeDistributionForMarket,
} from 'clients/api';
import { NULL_ADDRESS } from 'constants/address';
import { DAYS_PER_YEAR } from 'constants/daysPerYear';
import type FunctionKey from 'constants/functionKey';
import { useGetToken } from 'libs/tokens';
import type { LeToken } from 'types';
import { convertMantissaToTokens } from 'utilities';

interface UseGetPrimeEstimationInput {
  accountAddress?: string;
  suppliedAmountMantissa: BigNumber;
  borrowedAmountMantissa: BigNumber;
  stakedAmountXvsMantissa: BigNumber;
  leToken: LeToken | undefined;
}

interface UseGetPrimeEstimationOutput {
  dailyTokensDistributedAmount: BigNumber | undefined;
  borrowedTokens: BigNumber | undefined;
  borrowApyPercentage: BigNumber | undefined;
  borrowCapTokens: BigNumber | undefined;
  borrowCapCents: BigNumber | undefined;
  suppliedTokens: BigNumber | undefined;
  supplyApyPercentage: BigNumber | undefined;
  supplyCapTokens: BigNumber | undefined;
  supplyCapCents: BigNumber | undefined;
  userDailyPrimeRewards: BigNumber | undefined;
}

export type UseGetPrimeEstimationQueryKey = [
  FunctionKey.GET_PRIME_ESTIMATION,
  UseGetPrimeEstimationInput,
];

type Options = QueryObserverOptions<
  GetHypotheticalPrimeApysOutput,
  Error,
  GetHypotheticalPrimeApysOutput,
  GetHypotheticalPrimeApysOutput,
  UseGetPrimeEstimationQueryKey
>;

const useGetPrimeEstimation = (
  {
    accountAddress,
    borrowedAmountMantissa,
    stakedAmountXvsMantissa,
    suppliedAmountMantissa,
    leToken,
  }: UseGetPrimeEstimationInput,
  options?: Options,
) => {
  const lela = useGetToken({
    symbol: 'LELA',
  });

  const enabled = !!options?.enabled && !!leToken;

  const { data: primeDistributionForMarketData } = useGetPrimeDistributionForMarket(
    {
      vTokenAddress: leToken?.address || '',
    },
    {
      enabled,
    },
  );

  const { data: hypotheticalPrimeApysData } = useGetHypotheticalPrimeApys(
    {
      vTokenAddress: leToken?.address || '',
      userSupplyBalanceMantissa: suppliedAmountMantissa,
      userBorrowBalanceMantissa: borrowedAmountMantissa,
      userXvsStakedMantissa: stakedAmountXvsMantissa,
      accountAddress: accountAddress || NULL_ADDRESS,
    },
    {
      enabled,
    },
  );

  const estimation = useMemo(() => {
    let primeEstimation: UseGetPrimeEstimationOutput = {
      dailyTokensDistributedAmount: undefined,
      borrowedTokens: undefined,
      borrowApyPercentage: undefined,
      borrowCapTokens: undefined,
      borrowCapCents: undefined,
      suppliedTokens: undefined,
      supplyApyPercentage: undefined,
      supplyCapTokens: undefined,
      supplyCapCents: undefined,
      userDailyPrimeRewards: undefined,
    };

    if (hypotheticalPrimeApysData && primeDistributionForMarketData && leToken && lela) {
      const {
        borrowApyPercentage,
        borrowCapMantissa,
        borrowCapCents,
        supplyApyPercentage,
        supplyCapMantissa,
        supplyCapCents,
        userPrimeRewardsShare,
      } = hypotheticalPrimeApysData;

      const borrowedTokens = convertMantissaToTokens({
        value: borrowedAmountMantissa,
        token: leToken.underlyingToken,
      });

      const suppliedTokens = convertMantissaToTokens({
        value: suppliedAmountMantissa,
        token: leToken.underlyingToken,
      });

      const borrowCapTokens = convertMantissaToTokens({
        value: new BigNumber(borrowCapMantissa.toString()),
        token: leToken.underlyingToken,
      });

      const supplyCapTokens = convertMantissaToTokens({
        value: new BigNumber(supplyCapMantissa.toString()),
        token: leToken.underlyingToken,
      });

      const primeTokensDistributedAmount = convertMantissaToTokens({
        value: primeDistributionForMarketData.totalDistributedMantissa,
        token: leToken.underlyingToken,
      });

      const dailyTokensDistributedAmount = primeTokensDistributedAmount.dividedBy(DAYS_PER_YEAR);

      const userDailyPrimeRewards = primeTokensDistributedAmount
        .multipliedBy(userPrimeRewardsShare)
        .dividedBy(DAYS_PER_YEAR);

      primeEstimation = {
        dailyTokensDistributedAmount,
        userDailyPrimeRewards,
        borrowedTokens,
        borrowApyPercentage,
        borrowCapTokens,
        borrowCapCents,
        suppliedTokens,
        supplyApyPercentage,
        supplyCapTokens,
        supplyCapCents,
      };
    }

    return primeEstimation;
  }, [
    borrowedAmountMantissa,
    suppliedAmountMantissa,
    primeDistributionForMarketData,
    leToken,
    lela,
    hypotheticalPrimeApysData,
  ]);

  return {
    data: estimation,
  };
};

export default useGetPrimeEstimation;
