import BigNumber from 'bignumber.js';

import type { getIsolatedPoolParticipantsCount } from 'clients/subgraph';
import { COMPOUND_DECIMALS } from 'constants/compoundMantissa';
import type { PoolLens } from 'libs/contracts';
import { logError } from 'libs/errors';
import type { Asset, Pool, PrimeApy, Token, LeToken } from 'types';
import addUserPropsToPool from 'utilities/addUserPropsToPool';
import areAddressesEqual from 'utilities/areAddressesEqual';
import areTokensEqual from 'utilities/areTokensEqual';
import calculateApy from 'utilities/calculateApy';
import convertDollarsToCents from 'utilities/convertDollarsToCents';
import convertFactorFromSmartContract from 'utilities/convertFactorFromSmartContract';
import convertMantissaToTokens from 'utilities/convertMantissaToTokens';
import findTokenByAddress from 'utilities/findTokenByAddress';
import multiplyMantissaDaily from 'utilities/multiplyMantissaDaily';

import type { GetTokenBalancesOutput } from '../../getTokenBalances';
import type { GetRewardsDistributorSettingsMappingOutput } from '../getRewardsDistributorSettingsMapping';
import type { GetTokenPriceDollarsMappingOutput } from '../getTokenPriceDollarsMapping';
import formatDistributions from './formatDistributions';

export interface FormatToPoolsInput {
  tokens: Token[];
  blocksPerDay: number;
  currentBlockNumber: number;
  poolResults: Awaited<ReturnType<PoolLens['getAllPools']>>;
  rewardsDistributorSettingsMapping: GetRewardsDistributorSettingsMappingOutput;
  tokenPriceDollarsMapping: GetTokenPriceDollarsMappingOutput;
  primeApyMap: Map<string, PrimeApy>;
  userCollateralizedVTokenAddresses: string[];
  poolParticipantsCountResult?: Awaited<ReturnType<typeof getIsolatedPoolParticipantsCount>>;
  userVTokenBalancesAll?: Awaited<ReturnType<PoolLens['callStatic']['leTokenBalancesAll']>>;
  userTokenBalancesAll?: GetTokenBalancesOutput;
}

const formatToPools = ({
  tokens,
  blocksPerDay,
  currentBlockNumber,
  poolResults,
  rewardsDistributorSettingsMapping,
  tokenPriceDollarsMapping,
  poolParticipantsCountResult,
  userCollateralizedVTokenAddresses,
  primeApyMap,
  userVTokenBalancesAll,
  userTokenBalancesAll,
}: FormatToPoolsInput) => {
  const pools: Pool[] = poolResults.map(poolResult => {
    const subgraphPool = poolParticipantsCountResult?.pools.find(pool =>
      areAddressesEqual(pool.id, poolResult.comptroller),
    );

    const assets = poolResult.leTokens.reduce<Asset[]>((acc, leTokenMetaData) => {
      // Retrieve underlying token record
      const underlyingToken = findTokenByAddress({
        tokens,
        address: leTokenMetaData.underlyingAssetAddress,
      });

      if (!underlyingToken) {
        logError(`Record missing for underlying token: ${leTokenMetaData.underlyingAssetAddress}`);
        return acc;
      }

      const tokenPriceDollars = tokenPriceDollarsMapping[underlyingToken.address.toLowerCase()];

      if (!tokenPriceDollars) {
        return acc;
      }

      // Shape leToken
      const leToken: LeToken = {
        address: leTokenMetaData.leToken,
        decimals: 8,
        symbol: `le${underlyingToken.symbol}`,
        underlyingToken,
      };

      const userVTokenBalances = userVTokenBalancesAll?.find(userBalances =>
        areAddressesEqual(userBalances.leToken, leToken.address),
      );

      // Extract supplierCount and borrowerCount from subgraph result
      const subgraphPoolMarket = subgraphPool?.markets.find(market =>
        areAddressesEqual(market.id, leToken.address),
      );
      const supplierCount = +(subgraphPoolMarket?.supplierCount || 0);
      const borrowerCount = +(subgraphPoolMarket?.borrowerCount || 0);

      const borrowCapTokens = convertMantissaToTokens({
        value: new BigNumber(leTokenMetaData.borrowCaps.toString()),
        token: leToken.underlyingToken,
      });

      const supplyCapTokens = convertMantissaToTokens({
        value: new BigNumber(leTokenMetaData.supplyCaps.toString()),
        token: leToken.underlyingToken,
      });

      const reserveFactor = convertFactorFromSmartContract({
        factor: new BigNumber(leTokenMetaData.reserveFactorMantissa.toString()),
      });

      const collateralFactor = convertFactorFromSmartContract({
        factor: new BigNumber(leTokenMetaData.collateralFactorMantissa.toString()),
      });

      const cashTokens = convertMantissaToTokens({
        value: new BigNumber(leTokenMetaData.totalCash.toString()),
        token: leToken.underlyingToken,
      });

      const tokenPriceCents = convertDollarsToCents(tokenPriceDollars);
      const liquidityCents = cashTokens.multipliedBy(tokenPriceCents);

      const reserveTokens = convertMantissaToTokens({
        value: new BigNumber(leTokenMetaData.totalReserves.toString()),
        token: leToken.underlyingToken,
      });

      const exchangeRateVTokens = new BigNumber(1).div(
        new BigNumber(leTokenMetaData.exchangeRateCurrent.toString()).div(
          10 ** (COMPOUND_DECIMALS + leToken.underlyingToken.decimals - leToken.decimals),
        ),
      );

      const supplyDailyPercentageRate = multiplyMantissaDaily({
        mantissa: new BigNumber(leTokenMetaData.supplyRatePerBlock.toString()),
        blocksPerDay,
      });

      const supplyApyPercentage = calculateApy({
        dailyRate: supplyDailyPercentageRate,
      });

      const borrowDailyPercentageRate = multiplyMantissaDaily({
        mantissa: new BigNumber(leTokenMetaData.borrowRatePerBlock.toString()),
        blocksPerDay,
      });

      const borrowApyPercentage = calculateApy({
        dailyRate: borrowDailyPercentageRate,
      });

      const supplyPercentageRatePerBlock = supplyDailyPercentageRate.dividedBy(blocksPerDay);
      const borrowPercentageRatePerBlock = borrowDailyPercentageRate.dividedBy(blocksPerDay);

      const supplyBalanceVTokens = convertMantissaToTokens({
        value: new BigNumber(leTokenMetaData.totalSupply.toString()),
        token: leToken,
      });
      const supplyBalanceTokens = supplyBalanceVTokens.div(exchangeRateVTokens);
      const supplyBalanceCents = supplyBalanceTokens.multipliedBy(tokenPriceCents);

      const borrowBalanceTokens = convertMantissaToTokens({
        value: new BigNumber(leTokenMetaData.totalBorrows.toString()),
        token: leToken.underlyingToken,
      });

      const borrowBalanceCents = borrowBalanceTokens.multipliedBy(tokenPriceCents);

      // User-specific props
      const userBorrowBalanceTokens = userVTokenBalances
        ? convertMantissaToTokens({
            value: new BigNumber(userVTokenBalances.borrowBalanceCurrent.toString()),
            token: leToken.underlyingToken,
          })
        : new BigNumber(0);

      const userSupplyBalanceTokens = userVTokenBalances
        ? convertMantissaToTokens({
            value: new BigNumber(userVTokenBalances.balanceOfUnderlying.toString()),
            token: leToken.underlyingToken,
          })
        : new BigNumber(0);

      const tokenBalanceRes = userTokenBalancesAll?.tokenBalances.find(tokenBalance =>
        areTokensEqual(tokenBalance.token, leToken.underlyingToken),
      );

      const userWalletBalanceTokens = tokenBalanceRes
        ? convertMantissaToTokens({
            value: tokenBalanceRes.balanceMantissa,
            token: tokenBalanceRes.token,
          })
        : new BigNumber(0);

      const userSupplyBalanceCents = userSupplyBalanceTokens.multipliedBy(tokenPriceCents);
      const userBorrowBalanceCents = userBorrowBalanceTokens.multipliedBy(tokenPriceCents);
      const userWalletBalanceCents = userWalletBalanceTokens.multipliedBy(tokenPriceCents);

      const isCollateralOfUser = !!userCollateralizedVTokenAddresses.some(address =>
        areAddressesEqual(address, leToken.address),
      );

      const { supplyDistributions, borrowDistributions } = formatDistributions({
        blocksPerDay,
        underlyingToken,
        underlyingTokenPriceDollars: tokenPriceDollars,
        tokens,
        tokenPriceDollarsMapping,
        supplyBalanceTokens,
        borrowBalanceTokens,
        currentBlockNumber,
        rewardsDistributorSettings:
          rewardsDistributorSettingsMapping[leToken.address.toLowerCase()] || [],
        primeApy: primeApyMap.get(leToken.address),
      });

      const asset: Asset = {
        leToken,
        tokenPriceCents,
        reserveFactor,
        collateralFactor,
        cashTokens,
        liquidityCents,
        reserveTokens,
        exchangeRateVTokens,
        supplierCount,
        borrowerCount,
        borrowApyPercentage,
        supplyApyPercentage,
        supplyPercentageRatePerBlock,
        borrowPercentageRatePerBlock,
        supplyBalanceTokens,
        supplyBalanceCents,
        borrowBalanceTokens,
        borrowBalanceCents,
        borrowCapTokens,
        supplyCapTokens,
        supplyDistributions,
        borrowDistributions,
        userSupplyBalanceTokens,
        userSupplyBalanceCents,
        userBorrowBalanceTokens,
        userBorrowBalanceCents,
        userWalletBalanceTokens,
        userWalletBalanceCents,
        // This will be calculated after all assets have been formatted
        userPercentOfLimit: 0,
        isCollateralOfUser,
      };

      return [...acc, asset];
    }, []);

    const pool: Pool = addUserPropsToPool({
      name: poolResult.name,
      description: poolResult.description,
      comptrollerAddress: poolResult.comptroller,
      isIsolated: true,
      assets,
    });

    // Calculate userPercentOfLimit for each asset
    const formattedAssets: Asset[] = assets.map(asset => ({
      ...asset,
      userPercentOfLimit:
        asset.userBorrowBalanceCents?.isGreaterThan(0) &&
        pool.userBorrowLimitCents?.isGreaterThan(0)
          ? new BigNumber(asset.userBorrowBalanceCents)
              .times(100)
              .div(pool.userBorrowLimitCents)
              .dp(2)
              .toNumber()
          : 0,
    }));

    return {
      ...pool,
      assets: formattedAssets,
    };
  });

  return pools;
};

export default formatToPools;
