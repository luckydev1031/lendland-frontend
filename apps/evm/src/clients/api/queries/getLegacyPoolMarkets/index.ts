import BigNumber from 'bignumber.js';

import type { Market, Token } from 'types';
import { convertMantissaToTokens, restService } from 'utilities';

export interface ApiMarket {
  address: string;
  totalDistributedMantissa: string;
  underlyingDecimal: number;
  borrowerCount: number;
  supplierCount: number;
}

export interface GetLegacyPoolMarketsResponse {
  result: ApiMarket[];
  request: { addresses: string[] };
}

export interface GetLegacyPoolMarketsInput {
  lela: Token;
}

export interface GetLegacyPoolMarketsOutput {
  markets: Market[];
}

const getLegacyPoolMarkets = async ({
  lela,
}: GetLegacyPoolMarketsInput): Promise<GetLegacyPoolMarketsOutput> => {
  const response = await restService<GetLegacyPoolMarketsResponse>({
    endpoint: '/markets/core-pool',
    method: 'GET',
    params: {
      limit: 50,
    },
  });

  const payload = response.data;

  if (payload && 'error' in payload) {
    throw new Error(payload.error);
  }

  const markets: Market[] = (payload?.result || []).map(apiMarket => {
    const totalXvsDistributedTokens = apiMarket.totalDistributedMantissa
      ? convertMantissaToTokens({
          value: new BigNumber(apiMarket.totalDistributedMantissa),
          token: lela,
        })
      : new BigNumber(0);

    return {
      address: apiMarket.address,
      borrowerCount: apiMarket.borrowerCount,
      supplierCount: apiMarket.supplierCount,
      totalXvsDistributedTokens,
    };
  });

  return { markets };
};

export default getLegacyPoolMarkets;
