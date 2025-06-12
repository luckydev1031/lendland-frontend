import type BigNumber from 'bignumber.js';

import { NULL_ADDRESS } from 'constants/address';
import {
  borrowAveragesForToken,
  supplyAveragesForToken,
  xvsStakedAveragesForToken,
} from 'constants/prime';
import type { Prime } from 'libs/contracts';
import type { Asset, Token } from 'types';
import {
  areAddressesEqual,
  convertAprToApy,
  convertMantissaToTokens,
  convertTokensToMantissa,
} from 'utilities';

export interface ResolvePrimeSimulationDistributionsInput {
  primeContract: Prime;
  primeVTokenAddresses: string[];
  assets: Asset[];
  lela: Token;
  primeMinimumXvsToStakeMantissa: BigNumber;
  accountAddress?: string;
}

export const appendPrimeSimulationDistributions = async ({
  primeContract,
  primeVTokenAddresses,
  assets,
  lela,
  accountAddress,
  primeMinimumXvsToStakeMantissa,
}: ResolvePrimeSimulationDistributionsInput) => {
  const primeMinimumXvsToStakeTokens = convertMantissaToTokens({
    value: primeMinimumXvsToStakeMantissa,
    token: lela,
  });

  return Promise.allSettled(
    primeVTokenAddresses.map(primeVTokenAddress => {
      const asset = assets.find(poolAsset =>
        areAddressesEqual(poolAsset.leToken.address, primeVTokenAddress),
      );

      if (!asset) {
        return undefined;
      }

      const promise = async () => {
        const { symbol } = asset.leToken.underlyingToken;
        const averageBorrowBalanceTokens =
          borrowAveragesForToken[symbol] ||
          asset.borrowBalanceTokens.dividedBy(asset.borrowerCount || 1);

        const averageBorrowBalanceMantissa = convertTokensToMantissa({
          value: averageBorrowBalanceTokens,
          token: asset.leToken.underlyingToken,
        });

        const averageSupplyBalanceTokens =
          supplyAveragesForToken[symbol] ||
          asset.supplyBalanceTokens.dividedBy(asset.supplierCount || 1);
        const averageSupplyBalanceMantissa = convertTokensToMantissa({
          value: averageSupplyBalanceTokens,
          token: asset.leToken.underlyingToken,
        });

        const averageXvsStakedTokens =
          xvsStakedAveragesForToken[symbol] || primeMinimumXvsToStakeTokens;
        const averageXvsStakedMantissa = convertTokensToMantissa({
          value: averageXvsStakedTokens,
          token: lela,
        });

        const simulatedPrimeAprs = await primeContract.estimateAPR(
          primeVTokenAddress,
          accountAddress || NULL_ADDRESS,
          averageBorrowBalanceMantissa.toFixed(),
          averageSupplyBalanceMantissa.toFixed(),
          averageXvsStakedMantissa.toFixed(),
        );

        const referenceValues = {
          userSupplyBalanceTokens: averageSupplyBalanceTokens,
          userBorrowBalanceTokens: averageBorrowBalanceTokens,
          userXvsStakedTokens: averageXvsStakedTokens,
        };

        if (!simulatedPrimeAprs.borrowAPR.isZero()) {
          const borrowSimulatedPrimeApy = convertAprToApy({
            aprBips: simulatedPrimeAprs.borrowAPR.toString(),
          });

          asset.borrowDistributions.push({
            type: 'primeSimulation',
            token: asset.leToken.underlyingToken,
            apyPercentage: borrowSimulatedPrimeApy,
            referenceValues,
          });
        }

        if (!simulatedPrimeAprs.supplyAPR.isZero()) {
          const supplySimulatedPrimeApy = convertAprToApy({
            aprBips: simulatedPrimeAprs.supplyAPR.toString(),
          });

          asset.supplyDistributions.push({
            type: 'primeSimulation',
            token: asset.leToken.underlyingToken,
            apyPercentage: supplySimulatedPrimeApy,
            referenceValues,
          });
        }
      };

      return promise();
    }),
  );
};
