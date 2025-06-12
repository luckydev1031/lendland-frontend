import {
  type RequestWithdrawalFromXvsVaultInput,
  queryClient,
  requestWithdrawalFromXvsVault,
} from 'clients/api';
import FunctionKey from 'constants/functionKey';
import { type UseSendTransactionOptions, useSendTransaction } from 'hooks/useSendTransaction';
import { useAnalytics } from 'libs/analytics';
import { useGetXvsVaultContract } from 'libs/contracts';
import { useGetToken } from 'libs/tokens';
import { useChainId } from 'libs/wallet';
import { callOrThrow, convertMantissaToTokens } from 'utilities';

type TrimmedRequestWithdrawalFromXvsVaultInput = Omit<
  RequestWithdrawalFromXvsVaultInput,
  'xvsVaultContract'
>;
type Options = UseSendTransactionOptions<TrimmedRequestWithdrawalFromXvsVaultInput>;

const useRequestWithdrawalFromXvsVault = (options?: Options) => {
  const { chainId } = useChainId();
  const xvsVaultContract = useGetXvsVaultContract({
    passSigner: true,
  });

  const lela = useGetToken({
    symbol: 'LELA',
  });

  const { captureAnalyticEvent } = useAnalytics();

  return useSendTransaction({
    fnKey: FunctionKey.REQUEST_WITHDRAWAL_FROM_XVS_VAULT,
    fn: (input: TrimmedRequestWithdrawalFromXvsVaultInput) =>
      callOrThrow({ xvsVaultContract }, params =>
        requestWithdrawalFromXvsVault({
          ...params,
          ...input,
        }),
      ),
    onConfirmed: async ({ input }) => {
      const { poolIndex, amountMantissa } = input;

      if (lela) {
        captureAnalyticEvent('Token withdrawal requested from LELA vault', {
          poolIndex,
          rewardTokenSymbol: lela.symbol,
          tokenAmountTokens: convertMantissaToTokens({
            token: lela,
            value: amountMantissa,
          }).toNumber(),
        });

        const accountAddress = await xvsVaultContract?.signer.getAddress();

        // Invalidate cached user info
        queryClient.invalidateQueries([
          FunctionKey.GET_XVS_VAULT_USER_INFO,
          { chainId, accountAddress, rewardTokenAddress: lela.address, poolIndex },
        ]);

        // Invalidate cached user withdrawal requests
        queryClient.invalidateQueries([
          FunctionKey.GET_XVS_VAULT_WITHDRAWAL_REQUESTS,
          { chainId, accountAddress, rewardTokenAddress: lela.address, poolIndex },
        ]);
      }
    },
    options,
  });
};

export default useRequestWithdrawalFromXvsVault;
