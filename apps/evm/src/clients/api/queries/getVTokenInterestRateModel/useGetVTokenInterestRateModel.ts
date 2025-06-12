import { type QueryObserverOptions, useQuery } from 'react-query';

import getVTokenInterestRateModel, {
  type GetVTokenInterestRateModelOutput,
} from 'clients/api/queries/getVTokenInterestRateModel';
import FunctionKey from 'constants/functionKey';
import { useGetVTokenContract } from 'libs/contracts';
import { useChainId } from 'libs/wallet';
import type { ChainId, LeToken } from 'types';
import { callOrThrow } from 'utilities';

export type UseGetVTokenInterestRateModelQueryKey = [
  FunctionKey.GET_V_TOKEN_INTEREST_RATE_MODEL,
  { vTokenAddress: string; chainId: ChainId },
];

type Options = QueryObserverOptions<
  GetVTokenInterestRateModelOutput,
  Error,
  GetVTokenInterestRateModelOutput,
  GetVTokenInterestRateModelOutput,
  UseGetVTokenInterestRateModelQueryKey
>;

const useGetVTokenInterestRateModel = ({ leToken }: { leToken: LeToken }, options?: Options) => {
  const { chainId } = useChainId();
  const vTokenContract = useGetVTokenContract({ leToken });

  return useQuery(
    [FunctionKey.GET_V_TOKEN_INTEREST_RATE_MODEL, { vTokenAddress: leToken.address, chainId }],
    () => callOrThrow({ vTokenContract }, getVTokenInterestRateModel),
    options,
  );
};

export default useGetVTokenInterestRateModel;
