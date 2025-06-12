import wrapTokensAndSupply, {
  type WrapTokensAndSupplyInput,
} from 'clients/api/mutations/wrapTokensAndSupply';
import queryClient from 'clients/api/queryClient';
import FunctionKey from 'constants/functionKey';
import { type UseSendTransactionOptions, useSendTransaction } from 'hooks/useSendTransaction';
import { useGetNativeTokenGatewayContract } from 'libs/contracts';
import { useChainId } from 'libs/wallet';
import type { LeToken } from 'types';
import { callOrThrow } from 'utilities';

type TrimmedWrapTokensAndSupplyInput = Omit<WrapTokensAndSupplyInput, 'nativeTokenGatewayContract'>;
type Options = UseSendTransactionOptions<TrimmedWrapTokensAndSupplyInput>;

const useWrapTokensAndSupply = (
  { leToken, poolComptrollerAddress }: { leToken: LeToken; poolComptrollerAddress: string },
  options?: Options,
) => {
  const { chainId } = useChainId();
  const nativeToken = leToken.underlyingToken.tokenWrapped;
  const nativeTokenGatewayContract = useGetNativeTokenGatewayContract({
    passSigner: true,
    comptrollerContractAddress: poolComptrollerAddress,
  });

  return useSendTransaction({
    fnKey: FunctionKey.WRAP_TOKENS_AND_SUPPLY,
    fn: (input: TrimmedWrapTokensAndSupplyInput) =>
      callOrThrow({ nativeTokenGatewayContract }, params =>
        wrapTokensAndSupply({
          ...input,
          ...params,
        }),
      ),
    onConfirmed: async ({ input }) => {
      queryClient.invalidateQueries([
        FunctionKey.GET_BALANCE_OF,
        {
          chainId,
          accountAddress: input.accountAddress,
          tokenAddress: leToken.underlyingToken.address,
        },
      ]);

      queryClient.invalidateQueries([
        FunctionKey.GET_TOKEN_ALLOWANCE,
        {
          chainId,
          tokenAddress: leToken.underlyingToken.address,
          accountAddress: input.accountAddress,
          spenderAddress: nativeTokenGatewayContract?.address,
        },
      ]);

      queryClient.invalidateQueries([
        FunctionKey.GET_BALANCE_OF,
        {
          chainId,
          accountAddress: input.accountAddress,
          tokenAddress: nativeToken?.address,
        },
      ]);

      queryClient.invalidateQueries([
        FunctionKey.GET_TOKEN_BALANCES,
        {
          chainId,
          accountAddress: input.accountAddress,
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

export default useWrapTokensAndSupply;
