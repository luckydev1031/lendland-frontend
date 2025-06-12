import { type QueryObserverOptions, useQuery } from 'react-query';

import getLegacyPoolMarkets, {
  type GetLegacyPoolMarketsOutput,
} from 'clients/api/queries/getLegacyPoolMarkets';
import FunctionKey from 'constants/functionKey';
import { useGetToken } from 'libs/tokens';
import { callOrThrow } from 'utilities';

type Options = QueryObserverOptions<
  GetLegacyPoolMarketsOutput,
  Error,
  GetLegacyPoolMarketsOutput,
  GetLegacyPoolMarketsOutput,
  FunctionKey.GET_MAIN_MARKETS
>;

const useGetLegacyPoolMarkets = (options?: Options) => {
  const lela = useGetToken({
    symbol: 'LELA',
  });

  return useQuery(
    FunctionKey.GET_MAIN_MARKETS,
    () => callOrThrow({ lela }, getLegacyPoolMarkets),
    options,
  );
};

export default useGetLegacyPoolMarkets;
