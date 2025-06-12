import BigNumber from 'bignumber.js';

import type { Token, TransactionCategory, TransactionEvent, LeToken } from 'types';
import { findTokenByAddress } from 'utilities';

import type { TransactionResponse } from './types';

const formatTransaction = ({
  data: { amountMantissa, category, event, tokenAddress, timestamp, from, ...rest },
  leTokens,
  tokens,
  defaultToken,
}: {
  data: TransactionResponse;
  leTokens: LeToken[];
  tokens: Token[];
  defaultToken: Token;
}) => {
  // check if the tokenAddress is from a LeToken
  const leToken = findTokenByAddress({
    address: tokenAddress || '',
    tokens: leTokens,
  });

  // if it is, use the LeToken decimals and the image from the underlying token
  const transactionToken: Token | undefined = leToken
    ? { ...leToken.underlyingToken, decimals: leToken.decimals }
    : // else get the token from tokenAddress
      findTokenByAddress({ address: tokenAddress || '', tokens });

  // if neither is found, use LELA
  const token = transactionToken || defaultToken;

  return {
    ...rest,
    amountMantissa: new BigNumber(amountMantissa),
    category: category as TransactionCategory,
    event: event as TransactionEvent,
    token,
    from,
    timestamp: new Date(timestamp * 1000), // Convert timestamp to milliseconds
  };
};

export default formatTransaction;
