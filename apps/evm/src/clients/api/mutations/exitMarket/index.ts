import type { ContractTransaction } from 'ethers';

import type { IsolatedPoolComptroller, LegacyPoolComptroller } from 'libs/contracts';
import type { LeToken } from 'types';

export type ExitMarketInput = {
  comptrollerContract: LegacyPoolComptroller | IsolatedPoolComptroller;
  leToken: LeToken;
};

export type ExitMarketOutput = ContractTransaction;

const exitMarket = async ({
  comptrollerContract,
  leToken,
}: ExitMarketInput): Promise<ExitMarketOutput> => comptrollerContract.exitMarket(leToken.address);

export default exitMarket;
