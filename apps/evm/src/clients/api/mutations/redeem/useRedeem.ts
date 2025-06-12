import { queryClient } from 'clients/api';
import redeem, { type RedeemInput } from 'clients/api/mutations/redeem';
import FunctionKey from 'constants/functionKey';
import { type UseSendTransactionOptions, useSendTransaction } from 'hooks/useSendTransaction';
import { useAnalytics } from 'libs/analytics';
import { useGetVTokenContract } from 'libs/contracts';
import { useChainId } from 'libs/wallet';
import type { LeToken } from 'types';
import { callOrThrow, convertMantissaToTokens } from 'utilities';

type TrimmedRedeemInput = Omit<RedeemInput, 'tokenContract' | 'accountAddress'>;
type Options = UseSendTransactionOptions<TrimmedRedeemInput>;

const useRedeem = (
  { leToken, poolName }: { leToken: LeToken; poolName: string },
  options?: Options,
) => {
  const { chainId } = useChainId();
  const tokenContract = useGetVTokenContract({
    leToken,
    passSigner: true,
  });

  const { captureAnalyticEvent } = useAnalytics();

  return useSendTransaction({
    fnKey: FunctionKey.REDEEM,
    fn: (input: TrimmedRedeemInput) =>
      callOrThrow({ tokenContract }, params =>
        redeem({
          ...params,
          ...input,
        }),
      ),
    onConfirmed: async ({ input }) => {
      captureAnalyticEvent('Tokens withdrawn', {
        poolName,
        tokenSymbol: leToken.underlyingToken.symbol,
        tokenAmountTokens: convertMantissaToTokens({
          token: leToken.underlyingToken,
          value: input.amountMantissa,
        }).toNumber(),
        withdrewFullSupply: false,
      });

      const accountAddress = await tokenContract?.signer.getAddress();

      queryClient.invalidateQueries([
        FunctionKey.GET_V_TOKEN_BALANCE,
        {
          chainId,
          accountAddress,
          vTokenAddress: leToken.address,
        },
      ]);

      queryClient.invalidateQueries(FunctionKey.GET_V_TOKEN_BALANCES_ALL);
      queryClient.invalidateQueries(FunctionKey.GET_MAIN_MARKETS);
      queryClient.invalidateQueries(FunctionKey.GET_LEGACY_POOL);
      queryClient.invalidateQueries(FunctionKey.GET_ISOLATED_POOLS);
    },
    options,
  });
};

export default useRedeem;
