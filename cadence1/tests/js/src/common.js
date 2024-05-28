import { getAccountAddress } from './test-utils';

const FUNGIBLE_TOKEN_ADDRESS = '0xee82856bf20e2aa6';
const FLOW_TOKEN_ADDRESS = '0x0ae53cb6e3f42a79';
const UFIX64_PRECISION = 8;

export const CURRENCY = {
  DUC: 'DUC',
  FUT: 'FUT',
};
export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION);

export const getExampleAddress = async () => getAccountAddress('Example');
export const getDapperWalletAddress = async () =>
  getAccountAddress('DapperWallet');
export const getNFTStorefrontAddress = async () =>
  getAccountAddress('NFTStorefront');
export const getFlowTokenAddress = () => FLOW_TOKEN_ADDRESS;
export const getFungibleTokenAddress = () => FUNGIBLE_TOKEN_ADDRESS;
export const getCurrentBlockTime = () => Math.floor(Date.now() / 1000);

export const fallback = (value, ...fallbacks) => {
  if (value !== undefined) return value;
  for (const fallback of fallbacks) {
    if (fallback !== undefined) return fallback;
  }
  return null;
};
