import type { ContractTransaction } from 'ethers';

import type { SwapRouter } from 'libs/contracts';
import { VError } from 'libs/errors';
import type { Swap, LeToken } from 'types';
import { generateTransactionDeadline } from 'utilities';

export interface SwapTokensAndRepayInput {
  swapRouterContract: SwapRouter;
  swap: Swap;
  leToken: LeToken;
  isRepayingFullLoan: boolean;
}

export type SwapTokensAndRepayOutput = ContractTransaction;

const swapTokensAndRepay = async ({
  swapRouterContract,
  swap,
  leToken,
  isRepayingFullLoan = false,
}: SwapTokensAndRepayInput): Promise<SwapTokensAndRepayOutput> => {
  const transactionDeadline = generateTransactionDeadline();

  // Repay full loan in tokens using tokens
  if (
    isRepayingFullLoan &&
    swap.direction === 'exactAmountOut' &&
    !swap.fromToken.isNative &&
    !swap.toToken.isNative
  ) {
    return swapRouterContract.swapTokensForFullTokenDebtAndRepay(
      leToken.address,
      swap.maximumFromTokenAmountSoldMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
    );
  }

  // Repay full loan in BNBs using tokens
  if (
    isRepayingFullLoan &&
    swap.direction === 'exactAmountOut' &&
    !swap.fromToken.isNative &&
    swap.toToken.isNative
  ) {
    return swapRouterContract.swapTokensForFullBNBDebtAndRepay(
      swap.maximumFromTokenAmountSoldMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
    );
  }

  // Repay full loan in tokens using BNBs
  if (
    isRepayingFullLoan &&
    swap.direction === 'exactAmountOut' &&
    swap.fromToken.isNative &&
    !swap.toToken.isNative
  ) {
    return swapRouterContract.swapBNBForFullTokenDebtAndRepay(
      leToken.address,
      swap.routePath,
      transactionDeadline,
      {
        value: swap.maximumFromTokenAmountSoldMantissa.toFixed(),
      },
    );
  }

  // Sell fromTokens to repay as many toTokens as possible
  if (swap.direction === 'exactAmountIn' && !swap.fromToken.isNative && !swap.toToken.isNative) {
    return swapRouterContract.swapExactTokensForTokensAndRepay(
      leToken.address,
      swap.fromTokenAmountSoldMantissa.toFixed(),
      swap.minimumToTokenAmountReceivedMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
    );
  }

  // Sell BNBs to repay as many toTokens as possible
  if (swap.direction === 'exactAmountIn' && swap.fromToken.isNative && !swap.toToken.isNative) {
    return swapRouterContract.swapBNBForExactTokensAndRepay(
      leToken.address,
      swap.minimumToTokenAmountReceivedMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
      { value: swap.fromTokenAmountSoldMantissa.toFixed() },
    );
  }

  // Sell fromTokens to repay as many BNBs as possible
  if (swap.direction === 'exactAmountIn' && !swap.fromToken.isNative && swap.toToken.isNative) {
    return swapRouterContract.swapExactTokensForBNBAndRepay(
      swap.fromTokenAmountSoldMantissa.toFixed(),
      swap.minimumToTokenAmountReceivedMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
    );
  }

  // Repay toTokens by selling as few fromTokens as possible
  if (swap.direction === 'exactAmountOut' && !swap.fromToken.isNative && !swap.toToken.isNative) {
    return swapRouterContract.swapTokensForExactTokensAndRepay(
      leToken.address,
      swap.toTokenAmountReceivedMantissa.toFixed(),
      swap.maximumFromTokenAmountSoldMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
    );
  }

  // Repay toTokens by selling as few BNBs as possible
  if (swap.direction === 'exactAmountOut' && swap.fromToken.isNative && !swap.toToken.isNative) {
    return swapRouterContract.swapBNBForExactTokensAndRepay(
      leToken.address,
      swap.toTokenAmountReceivedMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
      { value: swap.maximumFromTokenAmountSoldMantissa.toFixed() },
    );
  }

  // Repay BNBs by selling as few fromTokens as possible
  if (swap.direction === 'exactAmountOut' && !swap.fromToken.isNative && swap.toToken.isNative) {
    return swapRouterContract.swapTokensForExactBNBAndRepay(
      swap.toTokenAmountReceivedMantissa.toFixed(),
      swap.maximumFromTokenAmountSoldMantissa.toFixed(),
      swap.routePath,
      transactionDeadline,
    );
  }

  throw new VError({
    type: 'unexpected',
    code: 'incorrectSwapInput',
  });
};

export default swapTokensAndRepay;
