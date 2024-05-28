import { Address } from '@onflow/types';
import { executeScript, getServiceAddress, getTemplate, shallResolve } from 'sdk-legacy';

export const getManagerAccounts = async () => {
  const FlowManager = await getServiceAddress();

  const addressMap = { FlowManager };

  let code = getTemplate('./cdc/get-accounts.cdc', { addressMap });
  const args = [
    [FlowManager, Address],
  ];

  const [accounts] = await shallResolve(executeScript({ code, args }));
  code = getTemplate('./cdc/get-contracts.cdc', { addressMap });
  const [contracts] = await shallResolve(executeScript({ code, args }));

  return { accounts, contracts };
};




