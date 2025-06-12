import { BigNumber as BN } from 'ethers';

import { lela } from '__mocks__/models/tokens';

import type { XvsVault } from 'libs/contracts';

import getXvsVaultPoolCount from '.';

describe('api/queries/getXvsVaultPoolCount', () => {
  test('returns the LELA vault pool length on success', async () => {
    const fakeOutput = BN.from('10');

    const poolLengthMock = vi.fn(async () => fakeOutput);

    const fakeContract = {
      poolLength: poolLengthMock,
    } as unknown as XvsVault;

    const response = await getXvsVaultPoolCount({
      xvsTokenAddress: lela.address,
      xvsVaultContract: fakeContract,
    });

    expect(poolLengthMock).toHaveBeenCalledTimes(1);
    expect(poolLengthMock).toHaveBeenCalledWith(lela.address);
    expect(response).toEqual({
      poolCount: fakeOutput.toNumber(),
    });
  });
});
