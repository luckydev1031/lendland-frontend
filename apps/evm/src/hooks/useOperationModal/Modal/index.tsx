/** @jsxImportSource @emotion/react */
import { Modal, type ModalProps, type TabContent, Tabs, TokenIconWithSymbol } from 'components';
import AssetAccessor from 'containers/AssetAccessor';
import { useTranslation } from 'libs/translations';
import type { LeToken } from 'types';

import BorrowForm from './BorrowForm';
import RepayForm from './RepayForm';
import SupplyForm from './SupplyForm';
import WithdrawForm from './WithdrawForm';

export interface OperationModalProps {
  onClose: ModalProps['handleClose'];
  leToken: LeToken;
  poolComptrollerAddress: string;
  initialActiveTabIndex?: number;
}

const OperationModal: React.FC<OperationModalProps> = ({
  onClose,
  leToken,
  poolComptrollerAddress,
  initialActiveTabIndex = 0,
}) => {
  const { t } = useTranslation();

  const tabsContent: TabContent[] = [
    {
      title: t('operationModal.supplyTabTitle'),
      content: (
        <AssetAccessor
          leToken={leToken}
          poolComptrollerAddress={poolComptrollerAddress}
          connectWalletMessage={t('operationModal.supply.connectWalletMessage')}
          action="supply"
        >
          {({ asset, pool }) => <SupplyForm asset={asset} pool={pool} onCloseModal={onClose} />}
        </AssetAccessor>
      ),
    },
    {
      title: t('operationModal.withdrawTabTitle'),
      content: (
        <AssetAccessor
          leToken={leToken}
          poolComptrollerAddress={poolComptrollerAddress}
          connectWalletMessage={t('operationModal.withdraw.connectWalletMessage')}
          action="withdraw"
        >
          {({ asset, pool }) => <WithdrawForm asset={asset} pool={pool} onCloseModal={onClose} />}
        </AssetAccessor>
      ),
    },
    {
      title: t('operationModal.borrowTabTitle'),
      content: (
        <AssetAccessor
          leToken={leToken}
          poolComptrollerAddress={poolComptrollerAddress}
          connectWalletMessage={t('operationModal.borrow.connectWalletMessage')}
          action="borrow"
        >
          {({ asset, pool }) => <BorrowForm asset={asset} pool={pool} onCloseModal={onClose} />}
        </AssetAccessor>
      ),
    },
    {
      title: t('operationModal.repayTabTitle'),
      content: (
        <AssetAccessor
          leToken={leToken}
          poolComptrollerAddress={poolComptrollerAddress}
          connectWalletMessage={t('operationModal.repay.connectWalletMessage')}
          action="repay"
        >
          {({ asset, pool }) => <RepayForm asset={asset} pool={pool} onCloseModal={onClose} />}
        </AssetAccessor>
      ),
    },
  ];

  return (
    <Modal
      isOpen
      title={
        <TokenIconWithSymbol token={leToken.underlyingToken} className="text-lg font-semibold" />
      }
      handleClose={onClose}
    >
      <Tabs tabsContent={tabsContent} initialActiveTabIndex={initialActiveTabIndex} />
    </Modal>
  );
};

export default OperationModal;
