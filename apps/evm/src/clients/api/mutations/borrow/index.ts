import type BigNumber from 'bignumber.js';
import type { ContractTransaction } from 'ethers';

import type { LeToken20, VBnb } from 'libs/contracts';

export interface BorrowInput {
  vTokenContract: LeToken20 | VBnb;
  amountMantissa: BigNumber;
}

export type BorrowOutput = ContractTransaction;

const borrow = async ({ vTokenContract, amountMantissa }: BorrowInput): Promise<BorrowOutput> =>
  vTokenContract.borrow(amountMantissa.toFixed(),[]);

export default borrow;
