import { getAccountAddress, mintFlow } from '@onflow/flow-js-testing';
import {
  getFlowTokenBalance,
  getFlowTokenSupply,
  transferFlowTokens,
  verifyValidReceiver,
} from '../src/flow-token';
import { toUFix64 } from '../src/common';
import { willPass, willResolve, willRevert } from '../src/test-utils';

describe.skip('Flow token', () => {
  it('should not be necessary to setup account', async () => {
    const Seller = await getAccountAddress('Seller');
    const supply = await getFlowTokenSupply();
    const sellerBalance = await getFlowTokenBalance(Seller);

    expect(Number(supply)).toBeGreaterThan(0);
    expect(Number(sellerBalance)).toBeGreaterThan(0);
  });

  it('should be possible to verify valid receiver', async () => {
    const ValidAddress = await getAccountAddress('ValidAddress');
    const verificationValid = await verifyValidReceiver(ValidAddress);
    expect(verificationValid).toBeTruthy();

    const InvalidAddress = '0x0000000000000000';
    const verificationInvalid = await verifyValidReceiver(InvalidAddress);
    expect(verificationInvalid).toBeFalsy();
  });

  it('should mint flow tokens, deposit, and update balance and total supply', async () => {
    const Seller = await getAccountAddress('Seller');
    const initialSupply = await getFlowTokenSupply();
    const sellerInitialBalance = await getFlowTokenBalance(Seller);
    const amount = toUFix64(50);

    await willPass(mintFlow(Seller, amount));

    const balance = await getFlowTokenBalance(Seller);
    expect(Number(balance)).toEqual(
      Number(sellerInitialBalance) + Number(amount),
    );

    const supply = await getFlowTokenSupply();
    expect(Number(supply)).toEqual(Number(initialSupply) + Number(amount));
  });

  it('should not be possible to withdraw more than the balance of the Vault', async () => {
    const Buyer = await getAccountAddress('Buyer');
    const Seller = await getAccountAddress('Seller');

    const sellerInitialBalance = await getFlowTokenBalance(Seller);
    const buyerInitialBalance = await getFlowTokenBalance(Buyer);

    const amount = toUFix64(1000);
    const overflowAmount = toUFix64(30000);

    await willResolve(mintFlow(Buyer, amount));
    await willRevert(transferFlowTokens(Buyer, Seller, overflowAmount));

    const sellerBalance = await getFlowTokenBalance(Seller);
    expect(sellerBalance).toEqual(sellerInitialBalance);

    const buyerBalance = await getFlowTokenBalance(Buyer);
    expect(Number(buyerBalance)).toEqual(
      Number(buyerInitialBalance) + Number(amount),
    );
  });

  it('should be possible to withdraw and deposit tokens from a Vault', async () => {
    const Buyer = await getAccountAddress('Buyer');
    const Seller = await getAccountAddress('Seller');

    const sellerInitialBalance = await getFlowTokenBalance(Seller);
    const buyerInitialBalance = await getFlowTokenBalance(Buyer);

    await willResolve(mintFlow(Buyer, toUFix64(1000)));
    await willPass(transferFlowTokens(Buyer, Seller, toUFix64(300)));

    const buyerBalance = await getFlowTokenBalance(Buyer);
    expect(Number(buyerBalance)).toEqual(Number(buyerInitialBalance) + 700);

    const sellerBalance = await getFlowTokenBalance(Seller);
    expect(Number(sellerBalance)).toEqual(Number(sellerInitialBalance) + 300);
  });
});
