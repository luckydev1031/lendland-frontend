import { useMemo } from 'react';

import { getVTokenContract } from 'libs/contracts/utilities/getVTokenContract';
import { useProvider, useSigner } from 'libs/wallet';
import type { LeToken } from 'types';

export interface UseGetVTokenContractInput {
  leToken: LeToken;
  passSigner?: boolean;
}

export const useGetVTokenContract = ({ leToken, passSigner = false }: UseGetVTokenContractInput) => {
  const { provider } = useProvider();
  const { signer } = useSigner();
  const signerOrProvider = passSigner ? signer : provider;

  return useMemo(
    () => (signerOrProvider ? getVTokenContract({ leToken, signerOrProvider }) : undefined),
    [signerOrProvider, leToken],
  );
};
