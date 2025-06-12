import type { PoolLens } from 'libs/contracts';

export interface GetVTokenBalancesAllInput {
  account: string;
  leTokenAddresses: string[];
  poolLensContract: PoolLens;
}

interface Balance {
  balanceOf: string;
  balanceOfUnderlying: string;
  borrowBalanceCurrent: string;
  tokenAllowance: string;
  tokenBalance: string;
  leToken: string;
}

export type GetVTokenBalancesAllOutput = {
  balances: Balance[];
};

const getVTokenBalancesAll = async ({
  poolLensContract,
  leTokenAddresses,
  account,
}: GetVTokenBalancesAllInput): Promise<GetVTokenBalancesAllOutput> => {
  const results = await poolLensContract.callStatic.leTokenBalancesAll(
    leTokenAddresses,
    account?.toLowerCase(),
  );

  // This is original returned as an array with these properties but at some
  // point the properties are getting removed from the type
  const balances = (results || []).map(item => ({
    balanceOf: item.balanceOf.toString(),
    balanceOfUnderlying: item.balanceOfUnderlying.toString(),
    borrowBalanceCurrent: item.borrowBalanceCurrent.toString(),
    tokenAllowance: item.tokenAllowance.toString(),
    tokenBalance: item.tokenBalance.toString(),
    leToken: item.leToken,
  }));

  return { balances };
};

export default getVTokenBalancesAll;
