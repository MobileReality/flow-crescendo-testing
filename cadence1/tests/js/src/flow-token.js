import { Address, UFix64 } from '@onflow/types';
import { executeScript, sendTransaction } from '@onflow/flow-js-testing';
import { willResolve } from './test-utils';

/**
 * Returns Flow Token balance for **account**.
 * @async
 * @param {string} account - account address
 * @throws Will throw an error if execution fails
 * @returns {Promise<UFix64>}
 * */
export const getFlowTokenBalance = async (account) =>
  willResolve(executeScript('flowToken/get_balance', [[account, Address]]));

/**
 * Returns Flow Token supply.
 * @async
 * @throws Will throw an error if execution fails
 * @returns {Promise<UFix64>}
 * */
export const getFlowTokenSupply = async () =>
  willResolve(executeScript('flowToken/get_supply'));

/**
 * Transfers **amount** of Flow tokens from **sender** account to **recipient**.
 * @async
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {string} amount - UFix64 amount to transfer
 * @returns {FclPromise<*>}
 * */
export const transferFlowTokens = async (sender, recipient, amount) => {
  const signers = [sender];
  const args = [
    [amount, UFix64],
    [recipient, Address],
  ];

  return sendTransaction({
    name: 'flowToken/transfer_tokens',
    signers,
    args,
  });
};

/**
 * Returns true if setup done, false otherwise
 * @throws Will throw an error if execution fails
 * @async
 * @returns {Promise<Bool>}
 * */
export const verifyValidReceiver = async (account) =>
  willResolve(
    executeScript('flowToken/verify_valid_receiver', [[account, Address]]),
  );
