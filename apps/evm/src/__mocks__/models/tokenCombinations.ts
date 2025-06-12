import { Token as PSToken } from '@pancakeswap/sdk/dist/index.js';

import { ChainId, type PSTokenCombination } from 'types';

import { busd, eth, wbnb, lela } from './tokens';

const tokenCombinations: PSTokenCombination[] = [
  [busd, eth],
  [busd, lela],
  [busd, wbnb],
  [eth, busd],
  [eth, lela],
  [eth, wbnb],
  [lela, eth],
  [lela, busd],
  [lela, wbnb],
  [wbnb, busd],
  [wbnb, eth],
  [wbnb, lela],
].map(([tokenA, tokenB]) => [
  new PSToken(ChainId.BSC_TESTNET, tokenA.address, tokenA.decimals, tokenA.symbol),
  new PSToken(ChainId.BSC_TESTNET, tokenB.address, tokenB.decimals, tokenB.symbol),
]);

export default tokenCombinations;
