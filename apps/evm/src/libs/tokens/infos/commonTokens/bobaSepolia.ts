import ethLogo from 'libs/tokens/img/eth.svg';
import usdcLogo from 'libs/tokens/img/usdc.svg';
import wethLogo from 'libs/tokens/img/weth.svg';
// import xvsLogo from 'libs/tokens/img/lela.svg';
import lelaLogo from 'libs/tokens/img/lela.png'
import bobaLogo from 'libs/tokens/img/boba.png'
import type { Token } from 'types';

const ethToken: Token = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  symbol: 'ETH',
  asset: ethLogo,
  isNative: true,
};

export const tokens: Token[] = [
  ethToken,
  {
    symbol: "BOBA",
    decimals: 18,
    address: "0x41BF347969e24Ba95C78cA33fdb04Be4FD128D51",
    asset: bobaLogo
  }, {
    symbol: "WETH",
    decimals: 18,
    address: "0x55FcF6745591064495Bd7fBA610FaD2510edfa58",
    asset: wethLogo,
  },
  {
    symbol: "LELA",
    decimals: 18,
    address: "0x2E6000f8F33831e9C09A820b5B843fb47af5397b",
    asset: lelaLogo,
  },
  {
    symbol: "USDC",
    decimals: 6,
    address: "0x2F6B7B6480E4849fA1Ed78c361a48EA26731Dc5A",
    asset: usdcLogo
  }
];
