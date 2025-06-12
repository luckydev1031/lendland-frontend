import { type RepayInput, queryClient, repay } from 'clients/api';
import FunctionKey from 'constants/functionKey';
import { type UseSendTransactionOptions, useSendTransaction } from 'hooks/useSendTransaction';
import { useAnalytics } from 'libs/analytics';
import { useGetMaximillionContract } from 'libs/contracts';
import { useAccountAddress, useChainId, useSigner } from 'libs/wallet';
import type { LeToken } from 'types';
import { callOrThrow, convertMantissaToTokens } from 'utilities';

type TrimmedRepayInput = Omit<RepayInput, 'signer' | 'leToken' | 'maximillionContract'>;
type Options = UseSendTransactionOptions<TrimmedRepayInput>;

const useRepay = (
  { leToken, poolName }: { leToken: LeToken; poolName: string },
  options?: Options,
) => {
  const { chainId } = useChainId();
  const { signer } = useSigner();
  const { accountAddress } = useAccountAddress();
  const { captureAnalyticEvent } = useAnalytics();
  const maximillionContract = useGetMaximillionContract({
    passSigner: true,
  });

  return useSendTransaction({
    fnKey: FunctionKey.REPAY,
    fn: (input: TrimmedRepayInput) =>
      callOrThrow({ signer }, params =>
        repay({
          ...params,
          ...input,
          leToken,
          maximillionContract,
        }),
      ),
    onConfirmed: async ({ input }) => {
      captureAnalyticEvent('Tokens repaid', {
        poolName,
        tokenSymbol: leToken.underlyingToken.symbol,
        tokenAmountTokens: convertMantissaToTokens({
          token: leToken.underlyingToken,
          value: input.amountMantissa,
        }).toNumber(),
        repaidFullLoan: input.isRepayingFullLoan,
      });

      queryClient.invalidateQueries(FunctionKey.GET_V_TOKEN_BALANCES_ALL);
      queryClient.invalidateQueries(FunctionKey.GET_MAIN_MARKETS);
      queryClient.invalidateQueries(FunctionKey.GET_LEGACY_POOL);
      queryClient.invalidateQueries(FunctionKey.GET_ISOLATED_POOLS);

      queryClient.invalidateQueries([
        FunctionKey.GET_TOKEN_ALLOWANCE,
        {
          chainId,
          tokenAddress: leToken.underlyingToken.address,
          accountAddress,
        },
      ]);
    },
    options,
  });
};

export default useRepay;
