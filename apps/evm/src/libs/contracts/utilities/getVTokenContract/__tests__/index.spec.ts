import type { Signer } from 'ethers';

import { vBnb, vBusd } from '__mocks__/models/leTokens';

import { getLeToken20Contract, getVBnbContract } from 'libs/contracts/generated/getters';

import { getVTokenContract } from '..';

vi.mock('libs/contracts/generated/getters');

describe('getVTokenContract', () => {
  it('should call getVBnbContract for vBNB token', () => {
    const signerOrProvider: Signer = {} as Signer;

    getVTokenContract({ leToken: vBnb, signerOrProvider });

    expect(getVBnbContract).toHaveBeenCalledWith({
      address: vBnb.address,
      signerOrProvider,
    });
  });

  it('should call getVBEP20Contract for other vBEP20 tokens', () => {
    const signerOrProvider: Signer = {} as Signer;

    getVTokenContract({ leToken: vBusd, signerOrProvider });

    expect(getLeToken20Contract).toHaveBeenCalledWith({
      address: vBusd.address,
      signerOrProvider,
    });
  });
});
