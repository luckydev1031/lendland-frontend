import BigNumber from 'bignumber.js';

import { lela } from '__mocks__/models/tokens';

import convertPriceMantissaToDollars from '..';

describe('utilities/convertPriceMantissaToDollars', () => {
  it('should convert price mantissa to dollars', () => {
    const result = convertPriceMantissaToDollars({
      decimals: lela.decimals,
      priceMantissa: '1000000000000000000',
    });

    expect(result).toEqual(new BigNumber(1));
  });
});
