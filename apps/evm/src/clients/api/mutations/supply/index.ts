import type BigNumber from 'bignumber.js';
import type { ContractTransaction, Signer } from 'ethers';

import { type VBnb, getVTokenContract } from 'libs/contracts';
import type { LeToken } from 'types';

export interface SupplyInput {
  leToken: LeToken;
  amountMantissa: BigNumber;
  signer: Signer;
}

export type SupplyOutput = ContractTransaction;

const supply = async ({ signer, leToken, amountMantissa }: SupplyInput): Promise<SupplyOutput> => {
  // Handle supplying BNB
  if (leToken.underlyingToken.isNative) {
    const tokenContract = getVTokenContract({
      leToken,
      signerOrProvider: signer,
    }) as VBnb;

    return tokenContract.mint({
      value: amountMantissa.toFixed(),
    });
  }

  // Handle supplying tokens other that BNB
  const tokenContract = getVTokenContract({ leToken, signerOrProvider: signer });
  return tokenContract.mint(amountMantissa.toFixed());
};

export default supply;
