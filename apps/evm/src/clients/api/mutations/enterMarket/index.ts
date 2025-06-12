import type { ContractTransaction } from 'ethers';

import type { IsolatedPoolComptroller, LegacyPoolComptroller } from 'libs/contracts';
import type { LeToken } from 'types';

export type EnterMarketInput = {
  comptrollerContract: LegacyPoolComptroller | IsolatedPoolComptroller;
  leToken: LeToken;
};

export type EnterMarketOutput = ContractTransaction;

const enterMarket = async ({
  comptrollerContract,
  leToken,
}: EnterMarketInput): Promise<EnterMarketOutput> =>
  comptrollerContract.enterMarkets([leToken.address]);

export default enterMarket;
