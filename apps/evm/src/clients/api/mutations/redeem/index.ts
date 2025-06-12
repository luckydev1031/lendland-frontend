import type BigNumber from 'bignumber.js';
import type { ContractTransaction } from 'ethers';

import type { LeToken20, VBnb } from 'libs/contracts';

export interface RedeemInput {
  tokenContract: LeToken20 | VBnb;
  amountMantissa: BigNumber;
}

export type RedeemOutput = ContractTransaction;

const redeem = async ({ tokenContract, amountMantissa }: RedeemInput): Promise<RedeemOutput> =>
  tokenContract.redeem(amountMantissa.toFixed(),[]);

export default redeem;
