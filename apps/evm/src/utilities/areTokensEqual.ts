import type { Token, LeToken } from 'types';

export const areTokensEqual = (tokenA: Token | LeToken, tokenB: Token | LeToken) =>
  tokenA.address.toLowerCase() === tokenB.address.toLowerCase();

export default areTokensEqual;
