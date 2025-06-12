import { type QueryObserverOptions, useQuery } from 'react-query';

import getVTokenBalanceOf, {
  type GetVTokenBalanceOfInput,
  type GetVTokenBalanceOfOutput,
} from 'clients/api/queries/getVTokenBalanceOf';
import FunctionKey from 'constants/functionKey';
import { useGetVTokenContract } from 'libs/contracts';
import { useChainId } from 'libs/wallet';
import type { ChainId, LeToken } from 'types';
import { callOrThrow } from 'utilities';

interface TrimmedGetVTokenBalanceOfInput extends Omit<GetVTokenBalanceOfInput, 'vTokenContract'> {
  leToken: LeToken;
}

export type UseGetVTokenBalanceOfQueryKey = [
  FunctionKey.GET_V_TOKEN_BALANCE,
  Omit<TrimmedGetVTokenBalanceOfInput, 'leToken'> & {
    vTokenAddress: string;
    chainId: ChainId;
  },
];

type Options = QueryObserverOptions<
  GetVTokenBalanceOfOutput,
  Error,
  GetVTokenBalanceOfOutput,
  GetVTokenBalanceOfOutput,
  UseGetVTokenBalanceOfQueryKey
>;

const useGetVTokenBalanceOf = (
  { accountAddress, leToken }: TrimmedGetVTokenBalanceOfInput,
  options?: Options,
) => {
  const { chainId } = useChainId();
  const vTokenContract = useGetVTokenContract({ leToken });

  return useQuery(
    [FunctionKey.GET_V_TOKEN_BALANCE, { accountAddress, vTokenAddress: leToken.address, chainId }],
    () =>
      callOrThrow({ vTokenContract }, params =>
        getVTokenBalanceOf({
          ...params,
          accountAddress,
        }),
      ),
    options,
  );
};

export default useGetVTokenBalanceOf;
