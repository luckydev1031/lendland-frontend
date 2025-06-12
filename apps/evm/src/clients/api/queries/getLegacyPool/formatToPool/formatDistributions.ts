import type BigNumber from 'bignumber.js';

import type { AssetDistribution, Token, LeToken } from 'types';
import { formatRewardDistribution, multiplyMantissaDaily } from 'utilities';

export interface FormatDistributionsInput {
  blocksPerDay: number;
  xvsSpeedMantissa: BigNumber;
  balanceDollars: BigNumber;
  xvsPriceDollars: BigNumber;
  lela: Token;
  leToken: LeToken;
  primeApy?: BigNumber;
}

export const formatDistributions = ({
  blocksPerDay,
  xvsSpeedMantissa,
  balanceDollars,
  xvsPriceDollars,
  lela,
  leToken,
  primeApy,
}: FormatDistributionsInput) => {
  const dailyDistributedXvs = multiplyMantissaDaily({
    mantissa: xvsSpeedMantissa,
    decimals: lela.decimals,
    blocksPerDay,
  });

  const xvsDistribution = formatRewardDistribution({
    rewardToken: lela,
    rewardTokenPriceDollars: xvsPriceDollars,
    dailyDistributedRewardTokens: dailyDistributedXvs,
    balanceDollars,
  });

  const distributions: AssetDistribution[] = [xvsDistribution];

  if (primeApy && !primeApy.isEqualTo(0)) {
    const primeDistribution: AssetDistribution = {
      type: 'prime',
      apyPercentage: primeApy,
      token: leToken.underlyingToken,
    };

    distributions.push(primeDistribution);
  }

  return distributions;
};
