/** @jsxImportSource @emotion/react */
import { Typography } from '@mui/material';

import { useGetVTokens } from 'clients/api';
import { useGetTokens } from 'libs/tokens';
import { useChainId } from 'libs/wallet';
import type { FormValues } from 'pages/Governance/ProposalList/CreateProposalModal/proposalSchema';
import type { ChainId, ProposalAction, Token, LeToken } from 'types';
import { generateChainExplorerUrl } from 'utilities';

import formatSignature from './formatSignature';
import getContractName from './getContractName';
import { useStyles } from './styles';

interface ReadableActionSignatureUiProps {
  action: FormValues['actions'][number] | ProposalAction;
  leTokens: LeToken[];
  tokens: Token[];
  chainId: ChainId;
  className?: string;
}

export const ReadableActionSignatureUi: React.FC<ReadableActionSignatureUiProps> = ({
  action,
  leTokens,
  tokens,
  chainId,
  className,
}) => {
  const styles = useStyles();

  const contractName = getContractName({
    target: action.target,
    leTokens,
    tokens,
    chainId,
  });

  return (
    <Typography css={styles.signature} className={className}>
      <Typography
        component="a"
        href={generateChainExplorerUrl({
          hash: action.target,
          urlType: 'address',
          chainId,
        })}
        target="_blank"
        rel="noreferrer"
      >
        {contractName}
      </Typography>

      {formatSignature(action)}
    </Typography>
  );
};

export type ReadableActionSignatureProps = Omit<
  ReadableActionSignatureUiProps,
  'leTokens' | 'chainId'
>;

export const ReadableActionSignature: React.FC<ReadableActionSignatureProps> = props => {
  const { chainId } = useChainId();
  const { data: getVTokensData } = useGetVTokens();
  const tokens = useGetTokens();
  const leTokens = getVTokensData?.leTokens || [];

  return (
    <ReadableActionSignatureUi {...props} chainId={chainId} leTokens={leTokens} tokens={tokens} />
  );
};
