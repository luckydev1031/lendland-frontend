import { BSC_MAINNET_CAN_ADDRESS } from 'constants/address';
import type { LegacyPoolComptroller, PoolLens, VenusLens } from 'libs/contracts';
import { logError } from 'libs/errors';
import type { Token, LeToken } from 'types';
import { areAddressesEqual } from 'utilities';
import findTokenByAddress from 'utilities/findTokenByAddress';

export interface GetVTokensInput {
  tokens: Token[];
  poolLensContract: PoolLens;
  poolRegistryContractAddress: string;
  // The VenusLens and core pool Comptroller contract only exists on the BSC network
  venusLensContract?: VenusLens;
  legacyPoolComptrollerContract?: LegacyPoolComptroller;
}

export type GetVTokensOutput = {
  leTokens: LeToken[];
};

const getVTokens = async ({
  tokens,
  poolLensContract,
  poolRegistryContractAddress,
  venusLensContract,
  legacyPoolComptrollerContract,
}: GetVTokensInput): Promise<GetVTokensOutput> => {
  // Fetch leToken meta data from isolated pools
  const [isolatedPools, legacyPoolVTokenAddresses] = await Promise.all([
    poolLensContract.getAllPools(poolRegistryContractAddress),
    legacyPoolComptrollerContract ? legacyPoolComptrollerContract.getAllMarkets() : undefined,
  ]);

  const leTokenMetaData = isolatedPools.reduce<
    {
      leToken: string;
      underlyingAssetAddress: string;
    }[]
  >((acc, isolatedPool) => acc.concat(isolatedPool.leTokens), []);

  // Fetch leToken meta data from core pool (this is only relevant to the BSC network)
  if (legacyPoolVTokenAddresses && venusLensContract) {
    const legacyPoolVTokenMetaData =
      await venusLensContract.callStatic.vTokenMetadataAll(legacyPoolVTokenAddresses);

    leTokenMetaData.push(...legacyPoolVTokenMetaData);
  }

  // Shape meta data into leToken
  const leTokens = leTokenMetaData.reduce<LeToken[]>((acc, metaData) => {
    // Temporary workaround to filter out CAN
    if (areAddressesEqual(metaData.underlyingAssetAddress, BSC_MAINNET_CAN_ADDRESS)) {
      // TODO: remove once a more generic solution has been integrated on the contract side
      return acc;
    }

    const underlyingToken = findTokenByAddress({
      tokens,
      address: metaData.underlyingAssetAddress,
    });

    if (!underlyingToken) {
      logError(`Record missing for token: ${metaData.underlyingAssetAddress}`);
      return acc;
    }

    const leToken: LeToken = {
      address: metaData.leToken,
      decimals: 8,
      symbol: `v${underlyingToken.symbol}`,
      underlyingToken,
    };

    return [...acc, leToken];
  }, []);

  return {
    leTokens,
  };
};

export default getVTokens;
