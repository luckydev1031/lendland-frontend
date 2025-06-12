import type { Token, LeToken } from 'types';
import { areAddressesEqual } from 'utilities';

function findTokenByAddress<TToken extends Token | LeToken>({
  address,
  tokens,
}: {
  address: string;
  tokens: TToken[];
}) {
  return tokens.find(token => areAddressesEqual(token.address, address));
}

export default findTokenByAddress;
