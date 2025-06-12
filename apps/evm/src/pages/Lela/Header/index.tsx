/** @jsxImportSource @emotion/react */
import { Paper, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import {
  useGetBalanceOf,
  useGetLegacyPool,
  useGetLegacyPoolTotalXvsDistributed,
  useGetVenusVaiVaultDailyRate,
} from 'clients/api';
import { EllipseAddress, Icon, LabeledProgressBar, TokenIcon } from 'components';
import useCopyToClipboard from 'hooks/useCopyToClipboard';
import { useGetLegacyPoolComptrollerContractAddress } from 'libs/contracts';
import { useGetToken } from 'libs/tokens';
import { useTranslation } from 'libs/translations';
import { useAccountAddress, useChainId } from 'libs/wallet';
import type { RewardDistributorDistribution, Token } from 'types';
import {
  convertMantissaToTokens,
  formatTokensToReadableValue,
  generateChainExplorerUrl,
} from 'utilities';

import { MINTED_XVS_MANTISSA } from '../constants';
import { useStyles } from '../styles';

interface HeaderProps {
  className?: string;
}

interface HeaderContainerProps {
  remainingDistributionMantissa: BigNumber;
  dailyXvsDistributedTokens: BigNumber;
  venusVaiVaultDailyRateMantissa: BigNumber;
  totalXvsDistributedMantissa: BigNumber;
  lela: Token;
}

export const HeaderUi: React.FC<HeaderProps & HeaderContainerProps> = ({
  className,
  remainingDistributionMantissa,
  dailyXvsDistributedTokens,
  venusVaiVaultDailyRateMantissa,
  totalXvsDistributedMantissa,
  lela,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { chainId } = useChainId();

  const copy = useCopyToClipboard(t('interactive.copy.xvsAddress'));
  const copyAddress = () => copy(lela.address);

  const readableDailyDistribution = useMemo(() => {
    const venusVaiVaultDailyRateTokens = convertMantissaToTokens({
      value: venusVaiVaultDailyRateMantissa,
      token: lela,
    });

    const dailyDistribution = dailyXvsDistributedTokens.plus(venusVaiVaultDailyRateTokens);

    return formatTokensToReadableValue({
      value: dailyDistribution,
      token: lela,
    });
  }, [dailyXvsDistributedTokens, venusVaiVaultDailyRateMantissa, lela]);

  const readableRemainingDistribution = useMemo(
    () =>
      convertMantissaToTokens({
        value: remainingDistributionMantissa,
        token: lela,
        returnInReadableFormat: true,
      }),
    [remainingDistributionMantissa, lela],
  );

  const percentOfXvsDistributed = useMemo(
    () => totalXvsDistributedMantissa.dividedBy(MINTED_XVS_MANTISSA).multipliedBy(100).toNumber(),
    [totalXvsDistributedMantissa],
  );

  return (
    <Paper className={className} css={styles.headerRoot}>
      <div css={styles.addressContainer}>
        <TokenIcon token={lela} />

        <Typography
          // NOTE: disable functionality for now
          // href={generateChainExplorerUrl({
          //   hash: lela.address,
          //   urlType: 'token',
          //   chainId,
          // })}
          href='#'
          // target="_blank"
          // rel="noreferrer"
          variant="small2"
          component="a"
          css={[styles.whiteText, styles.addressText]}
        >
          {/* <EllipseAddress address={lela.address} ellipseBreakpoint="xl" /> */}
          <EllipseAddress address={'0xb42097a978C1c5D3b87c3dF87b18Cbf59B393a29'} ellipseBreakpoint="xl" />
        </Typography>

        <div css={styles.copyIconContainer}>
          <Icon name="copy" onClick={copyAddress} css={styles.copyIcon} size={styles.iconSizeXl} />
        </div>
      </div>

      <div css={styles.slider}>
        <LabeledProgressBar
          css={styles.progressBar}
          min={1}
          max={100}
          step={1}
          value={percentOfXvsDistributed}
          ariaLabel={t('lela.progressBar')}
          greyLeftText={t('lela.dailyDistribution')}
          // NOTE: add static data for now
          // whiteLeftText={readableDailyDistribution}
          whiteLeftText={'0 LELA'}
          greyRightText={t('lela.remaining')}
          // whiteRightText={readableRemainingDistribution}
          // NOTE: add static data for now
          whiteRightText={'0 LELA'}
        />
      </div>
    </Paper>
  );
};

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { accountAddress } = useAccountAddress();
  const lela = useGetToken({
    symbol: 'LELA',
  });

  const { data: venusVaiVaultDailyRateData } = useGetVenusVaiVaultDailyRate();

  const { data: getLegacyPoolData } = useGetLegacyPool({
    accountAddress,
  });

  const dailyXvsDistributedTokens = useMemo(
    () =>
      (getLegacyPoolData?.pool.assets || []).reduce((acc, asset) => {
        // Note: assets from the legacy pool only yield LELA, hence why we only
        // take the first distribution token in consideration (which will
        // always be LELA here)
        const supplyXvsDistribution = asset.supplyDistributions[0] as RewardDistributorDistribution;
        const borrowXvsDistribution = asset.borrowDistributions[0] as RewardDistributorDistribution;

        const dailyXvsDistributed = supplyXvsDistribution.dailyDistributedTokens.plus(
          borrowXvsDistribution.dailyDistributedTokens,
        );

        return acc.plus(dailyXvsDistributed);
      }, new BigNumber(0)),
    [getLegacyPoolData?.pool.assets],
  );

  const { data: legacyPoolTotalXvsDistributedData } = useGetLegacyPoolTotalXvsDistributed();

  const legacyPoolComptrollerContractAddress = useGetLegacyPoolComptrollerContractAddress();

  const { data: xvsRemainingDistributionData } = useGetBalanceOf(
    {
      token: lela!,
      accountAddress: legacyPoolComptrollerContractAddress || '',
    },
    {
      enabled: !!legacyPoolComptrollerContractAddress,
    },
  );

  return (
    <HeaderUi
      remainingDistributionMantissa={
        xvsRemainingDistributionData?.balanceMantissa || new BigNumber(0)
      }
      venusVaiVaultDailyRateMantissa={
        venusVaiVaultDailyRateData?.dailyRateMantissa || new BigNumber(0)
      }
      className={className}
      dailyXvsDistributedTokens={dailyXvsDistributedTokens}
      totalXvsDistributedMantissa={
        legacyPoolTotalXvsDistributedData?.totalXvsDistributedMantissa || new BigNumber(0)
      }
      lela={lela!}
    />
  );
};

export default Header;
