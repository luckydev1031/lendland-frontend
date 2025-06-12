import { type UseQueryOptions, type UseQueryResult, useQueries } from 'react-query';

import {
  type GetXvsVaultPendingWithdrawalsFromBeforeUpgradeOutput,
  type GetXvsVaultPoolInfoOutput,
  type GetXvsVaultUserInfoOutput,
  getXvsVaultPendingWithdrawalsFromBeforeUpgrade,
  getXvsVaultPoolInfo,
  getXvsVaultUserInfo,
} from 'clients/api';
import FunctionKey from 'constants/functionKey';
import { useGetXvsVaultContract } from 'libs/contracts';
import { useGetToken } from 'libs/tokens';
import { useChainId } from 'libs/wallet';
import { callOrThrow } from 'utilities';

export interface UseGetXvsVaultPoolsInput {
  poolsCount: number;
  accountAddress?: string;
}

export type UseGetXvsVaultPoolsOutput = UseQueryResult<
  | GetXvsVaultPoolInfoOutput
  | GetXvsVaultUserInfoOutput
  | GetXvsVaultPendingWithdrawalsFromBeforeUpgradeOutput
>[];

const useGetXvsVaultPools = ({
  accountAddress,
  poolsCount,
}: UseGetXvsVaultPoolsInput): UseGetXvsVaultPoolsOutput => {
  const { chainId } = useChainId();

  const xvsVaultContract = useGetXvsVaultContract();

  const lela = useGetToken({
    symbol: 'LELA',
  });

  const poolQueries: UseQueryOptions<
    | GetXvsVaultPoolInfoOutput
    | GetXvsVaultUserInfoOutput
    | GetXvsVaultPendingWithdrawalsFromBeforeUpgradeOutput
  >[] = [];

  // Fetch pool infos
  // TODO: use multicall
  for (let poolIndex = 0; poolIndex < poolsCount; poolIndex++) {
    poolQueries.push({
      queryFn: () =>
        callOrThrow({ xvsVaultContract, lela }, params =>
          getXvsVaultPoolInfo({
            ...params,
            rewardTokenAddress: params.lela.address,
            poolIndex,
          }),
        ),
      queryKey: [
        FunctionKey.GET_XVS_VAULT_POOL_INFOS,
        { chainId, rewardTokenAddress: lela?.address, poolIndex },
      ],
    });

    poolQueries.push({
      queryFn: () =>
        callOrThrow({ xvsVaultContract, lela }, params =>
          getXvsVaultUserInfo({
            ...params,
            rewardTokenAddress: params.lela.address,
            poolIndex,
            accountAddress: accountAddress || '',
          }),
        ),
      queryKey: [
        FunctionKey.GET_XVS_VAULT_USER_INFO,
        { chainId, accountAddress, rewardTokenAddress: lela?.address, poolIndex },
      ],
      enabled: !!accountAddress,
    });

    poolQueries.push({
      queryFn: () =>
        callOrThrow({ xvsVaultContract, lela }, params =>
          getXvsVaultPendingWithdrawalsFromBeforeUpgrade({
            ...params,
            rewardTokenAddress: params.lela.address,
            poolIndex,
            accountAddress: accountAddress || '',
          }),
        ),
      queryKey: [
        FunctionKey.GET_XVS_VAULT_PENDING_WITHDRAWALS_FROM_BEFORE_UPGRADE,
        { chainId, accountAddress, rewardTokenAddress: lela?.address, poolIndex },
      ],
      enabled: !!accountAddress,
    });
  }

  return useQueries(poolQueries);
};

export default useGetXvsVaultPools;
