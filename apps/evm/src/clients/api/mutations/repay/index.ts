import type BigNumber from 'bignumber.js';
import type { ContractTransaction, Signer } from 'ethers';

import MAX_UINT256 from 'constants/maxUint256';
import { type Maximillion, type VBnb, getVTokenContract } from 'libs/contracts';
import type { LeToken } from 'types';
import { callOrThrow } from 'utilities';

export interface RepayInput {
  signer: Signer;
  leToken: LeToken;
  amountMantissa: BigNumber;
  isRepayingFullLoan: boolean;
  maximillionContract?: Maximillion;
}

export type RepayOutput = ContractTransaction;

export const REPAYMENT_BNB_BUFFER_PERCENTAGE = 0.001;

const repayFullBnbLoan = async ({
  leToken,
  amountMantissa,
  signer,
  maximillionContract,
}: {
  leToken: LeToken;
  amountMantissa: BigNumber;
  signer: Signer;
  maximillionContract: Maximillion;
}) => {
  const amountWithBufferMantissa = amountMantissa.multipliedBy(1 + REPAYMENT_BNB_BUFFER_PERCENTAGE);
  const accountAddress = await signer.getAddress();

  return maximillionContract.repayBehalfExplicit(accountAddress, leToken.address, {
    value: amountWithBufferMantissa.toFixed(0),
  });
};

const repay = async ({
  signer,
  leToken,
  amountMantissa,
  maximillionContract,
  isRepayingFullLoan = false,
}: RepayInput): Promise<RepayOutput> => {
  // Handle repaying tokens other than BNB
  if (!leToken.underlyingToken.isNative) {
    const vTokenContract = getVTokenContract({ leToken, signerOrProvider: signer });

    return vTokenContract.repayBorrow(
      isRepayingFullLoan ? MAX_UINT256.toFixed() : amountMantissa.toFixed()
      ,[]
    );
  }

  // Handle repaying full BNB loan
  if (isRepayingFullLoan) {
    return callOrThrow({ maximillionContract, signer }, params =>
      repayFullBnbLoan({
        amountMantissa,
        leToken,
        ...params,
      }),
    );
  }

  // Handle repaying partial BNB loan
  const vBnbContract = getVTokenContract({
    leToken,
    signerOrProvider: signer,
  }) as VBnb;

  return vBnbContract.repayBorrow({
    value: amountMantissa.toFixed(),
  });
};

export default repay;
