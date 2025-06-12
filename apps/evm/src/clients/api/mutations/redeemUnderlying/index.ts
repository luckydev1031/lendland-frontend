import type BigNumber from 'bignumber.js';
import type { ContractTransaction } from 'ethers';

import type { LeToken20, VBnb } from 'libs/contracts';

export interface RedeemUnderlyingInput {
  vTokenContract: LeToken20 | VBnb;
  amountMantissa: BigNumber;
}

export type RedeemUnderlyingOutput = ContractTransaction;

const redeemUnderlying = async ({
  vTokenContract,
  amountMantissa,
}: RedeemUnderlyingInput): Promise<RedeemUnderlyingOutput> =>
  vTokenContract.redeemUnderlying(amountMantissa.toFixed(),[]);

export default redeemUnderlying;
