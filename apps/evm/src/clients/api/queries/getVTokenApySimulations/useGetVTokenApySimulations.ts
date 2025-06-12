import { useMemo } from 'react';
import { type QueryObserverOptions, useQuery } from 'react-query';

import getVTokenApySimulations, {
  type GetVTokenApySimulationsOutput,
} from 'clients/api/queries/getVTokenApySimulations';
import useGetVTokenInterestRateModel from 'clients/api/queries/getVTokenInterestRateModel/useGetVTokenInterestRateModel';
import FunctionKey from 'constants/functionKey';
import { useGetChainMetadata } from 'hooks/useGetChainMetadata';
import { getJumpRateModelContract, getJumpRateModelV2Contract } from 'libs/contracts';
import { useChainId, useProvider } from 'libs/wallet';
import type { Asset, ChainId, LeToken } from 'types';
import { callOrThrow } from 'utilities';

export type UseGetVTokenApySimulationsQueryKey = [
  FunctionKey.GET_V_TOKEN_APY_SIMULATIONS,
  { vTokenAddress: string; chainId: ChainId },
];

type Options = QueryObserverOptions<
  GetVTokenApySimulationsOutput,
  Error,
  GetVTokenApySimulationsOutput,
  GetVTokenApySimulationsOutput,
  UseGetVTokenApySimulationsQueryKey
>;

const useGetVTokenApySimulations = (
  {
    asset,
    leToken,
    isIsolatedPoolMarket,
  }: {
    asset: Asset | undefined;
    leToken: LeToken;
    isIsolatedPoolMarket: boolean;
  },
  options?: Options,
) => {
  const { provider } = useProvider();
  const { chainId } = useChainId();
  const { blocksPerDay } = useGetChainMetadata();

  const { data: interestRateModelData } = useGetVTokenInterestRateModel({ leToken });

  const interestRateModelContract = useMemo(() => {
    if (!interestRateModelData?.contractAddress) {
      return undefined;
    }

    const input = {
      address: interestRateModelData.contractAddress,
      signerOrProvider: provider,
    };

    return isIsolatedPoolMarket
      ? getJumpRateModelV2Contract(input)
      : getJumpRateModelContract(input);
  }, [interestRateModelData?.contractAddress, isIsolatedPoolMarket, provider]);

  return useQuery(
    [FunctionKey.GET_V_TOKEN_APY_SIMULATIONS, { vTokenAddress: leToken.address, chainId }],
    () =>
      callOrThrow({ interestRateModelContract, asset }, params =>
        getVTokenApySimulations({
          ...params,
          isIsolatedPoolMarket,
          blocksPerDay,
        }),
      ),
    {
      ...options,
      enabled:
        (options?.enabled === undefined || options?.enabled) &&
        !!interestRateModelContract &&
        !!asset,
    },
  );
};

export default useGetVTokenApySimulations;
