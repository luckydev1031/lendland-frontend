import { type QueryObserverOptions, useQuery } from 'react-query';

import getTransactions, {
  type GetTransactionsInput,
  type GetTransactionsOutput,
} from 'clients/api/queries/getTransactions';
import useGetVTokens from 'clients/api/queries/getVTokens/useGetVTokens';
import FunctionKey from 'constants/functionKey';
import { useGetToken, useGetTokens } from 'libs/tokens';
import { generatePseudoRandomRefetchInterval } from 'utilities';

type TrimmedGetTransactionsInput = Omit<
  GetTransactionsInput,
  'leTokens' | 'tokens' | 'defaultToken'
>;

type Options = QueryObserverOptions<
  GetTransactionsOutput,
  Error,
  GetTransactionsOutput,
  GetTransactionsOutput,
  [FunctionKey.GET_TRANSACTIONS, TrimmedGetTransactionsInput]
>;

const refetchInterval = generatePseudoRandomRefetchInterval();

const useGetTransactions = (params: TrimmedGetTransactionsInput, options?: Options) => {
  const { data: getVTokenData } = useGetVTokens();
  const leTokens = getVTokenData?.leTokens || [];

  const tokens = useGetTokens();
  const lela = useGetToken({
    symbol: 'LELA',
  });

  return useQuery(
    [FunctionKey.GET_TRANSACTIONS, params],
    () => getTransactions({ ...params, leTokens, tokens, defaultToken: lela || tokens[0] }),
    {
      keepPreviousData: true,
      refetchInterval,
      ...options,
      enabled: leTokens.length > 0 && (!options || options.enabled),
    },
  );
};

export default useGetTransactions;
