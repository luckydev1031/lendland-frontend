import { useMemo } from 'react';

import { useGetVTokens } from 'clients/api';
import { Icon, TertiaryButton } from 'components';
import PLACEHOLDER_KEY from 'constants/placeholderKey';
import { addTokenToWallet, canAddTokenToWallet, useAccountAddress } from 'libs/wallet';
import type { LeToken } from 'types';
import { findTokenByAddress } from 'utilities';

export interface VTokenSymbolUiProps {
  leToken?: LeToken;
  isUserConnected: boolean;
}

export const VTokenSymbolUi: React.FC<VTokenSymbolUiProps> = ({ leToken, isUserConnected }) => (
  <div className="inline-flex items-center">
    <span>{leToken?.underlyingToken.symbol || PLACEHOLDER_KEY}</span>

    {isUserConnected && leToken && canAddTokenToWallet() && (
      <TertiaryButton
        className="border-cards bg-cards text-blue hover:text-offWhite ml-4 h-auto p-1"
        onClick={() => addTokenToWallet(leToken.underlyingToken)}
      >
        <Icon name="wallet" className="ml-[1px] h-5 w-5 text-inherit " />
      </TertiaryButton>
    )}
  </div>
);

export interface VTokenSymbolProps {
  vTokenAddress?: string;
}

const VTokenSymbol: React.FC<VTokenSymbolProps> = ({ vTokenAddress }) => {
  const { accountAddress } = useAccountAddress();
  const { data: getVTokensData } = useGetVTokens();

  const leToken = useMemo(
    () =>
      vTokenAddress
        ? findTokenByAddress({
            tokens: getVTokensData?.leTokens || [],
            address: vTokenAddress,
          })
        : undefined,
    [vTokenAddress, getVTokensData],
  );

  return <VTokenSymbolUi leToken={leToken} isUserConnected={!!accountAddress} />;
};

export default VTokenSymbol;
