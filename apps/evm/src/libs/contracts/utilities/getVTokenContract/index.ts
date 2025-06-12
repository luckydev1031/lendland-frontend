import type { Provider } from '@ethersproject/abstract-provider';
import type { Signer } from 'ethers';

import { getLeToken20Contract, getVBnbContract } from 'libs/contracts/generated/getters';
import type { LeToken } from 'types';

export interface GetVTokenContractInput {
  leToken: LeToken;
  signerOrProvider: Signer | Provider;
}

export const getVTokenContract = ({ leToken, signerOrProvider }: GetVTokenContractInput) => {
  const input = {
    address: leToken.address,
    signerOrProvider,
  };

  if (leToken.symbol === 'vBNB') {
    return getVBnbContract(input);
  }

  return getLeToken20Contract(input);
};
