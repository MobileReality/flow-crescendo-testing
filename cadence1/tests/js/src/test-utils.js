import {
  deployContractByName,
  executeScript,
  getScriptCode,
  getServiceAddress,
  getTransactionCode,
  replaceImportAddresses,
  sendTransaction,
} from '@onflow/flow-js-testing';
import { Address, String as _String } from '@onflow/types';
const originalDescribe = describe.original;
import * as fcl from '@onflow/fcl';

export const deployTestUtils = async () => {
  const Service = await getServiceAddress();

  return deployContractByName({ to: Service, name: 'TestUtils' });
};

export const getTestUtilsAddress = async () => {
  return getServiceAddress();
};

export const importUtils = async () => {
  const Service = await getServiceAddress();
  return `import TestUtils from ${Service}`;
};

export const importExists = (contractName, code) => {
  return new RegExp(`import\\s+${contractName}`).test(code);
};

export const applyUtilsMethods = async (code) => {
  let injectedImports = code;
  if (!importExists('TestUtils', code)) {
    const imports = await importUtils();
    injectedImports = `
      ${imports}
      ${code}  
  `;
  }
  return injectedImports.replace(
    /getCurrentBlock\(\).timestamp/g,
    `TestUtils.getBlockTimestamp()`,
  );
};

export const getBlockTimestamp = async () => {
  const TestUtils = await getTestUtilsAddress();
  const addressMap = { TestUtils };
  const name = 'testUtils/get_block_timestamp';
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

export const setBlockTimestamp = async (timestamp) => {
  const TestUtils = await getTestUtilsAddress();
  const addressMap = { TestUtils };
  const name = 'testUtils/set_block_timestamp';

  const code = await getTransactionCode({ name, addressMap });
  const args = [timestamp];
  const signers = [TestUtils];

  return sendTransaction({ code, args, signers });
};

export const setContractAddress = async (contractName, address) => {
  const FlowManager = await getServiceAddress();
  const addressMap = { FlowManager };
  const name = 'testUtils/set_contract_address';

  const code = await getTransactionCode({ name, addressMap });
  const args = [
    [contractName, _String],
    [address, Address],
  ];
  const signers = [FlowManager];

  return sendTransaction({ code, args, signers });
};

export const sendTransactionByName = async (name, signers, args = []) => {
  return sendTransaction({
    code: await getTransactionCode({ name }),
    signers,
    args,
  });
};
export const executeScriptByName = async (name, args = []) => {
  return executeScript({
    code: await getScriptCode({ name }),
    args,
  });
};

export const runInlineTx = async (codeString, signers = [], args = []) => {
  const code = replaceImportAddresses(codeString, {});
  return sendTransaction({ code, signers, args });
};
export const runInlineScript = async (codeString, args = []) => {
  const code = replaceImportAddresses(codeString, {});
  return executeScript({ code, args });
};
export const cleanType = (type) =>
  type?.toLowerCase()?.startsWith('a.0x') ? `A.${type.slice(4)}` : type;
export const getEvents = async (event, from = null, to = null) => {
  event = cleanType(event);
  if (!event.startsWith('A.')) throw new Error('wrong event format');
  let block;
  if (from < 0 || to < 0 || to === null) {
    ({ block } = await fcl.send(await fcl.build([fcl.getBlock(true)])));
  }
  if (from < 0 || from === null) {
    from = block.height + (from ?? 0);
  }
  if (to < 0 || to === null) {
    to = to === null ? block.height : block.height + to;
  }
  if (from > to) throw new Error('from must be less than to');
  const events = await fcl.decode(
    await fcl.send([fcl.getEventsAtBlockHeightRange(event, from, to)]),
  );
  return events;
};

/**
 * Makes the test run in parallel
 * @param {T} dict
 * @returns {T}
 * @template T
 * */
export const cleanDictUndefined = (dict) =>
  Object.fromEntries(
    Object.entries(dict).filter(([, value]) => value !== undefined),
  );

/**
 * Makes the test run in parallel
 * @param {string} name
 * @returns {{name: string, parallel: true}}
 * */
export const parallel = (name) => {
  return { name, parallel: true };
};

// Helpers for bundling etc, that play nice with IDEs
export const describeParallel = (name, callback) =>
  describe(parallel(name), callback);

describeParallel.skip = (name, callback) =>
  describe.skip(parallel(name), callback);

export const describeBundle = (isParallel, otherModule) => {
  const result = (name, callback, skip = false) => {
    otherModule.exports = () => {
      return (skip ? originalDescribe.skip : originalDescribe)(name, callback);
    };
    if (!global.bundled) {
      const wrap = isParallel ? parallel : String;
      (skip ? describe.skip : describe)(wrap(name), callback);
    }
  };
  result.skip = (name, callback) => result(name, callback, true);
  return result;
};

/**
 * If the following fails, skip all other tests in suite
 * @async
 * @param {((...args: any)=>T|Promise<T>)|Promise<T>} item
 * @param {any} [args]
 * @returns {Promise<T>}
 * @template T
 * */
export const trySkipSuite = async (item, ...args) => {
  try {
    if (typeof item === 'function') {
      return await item(...args);
    }
    return await item;
  } catch (err) {
    const wrapped = err instanceof Error ? err : new Error(err);
    wrapped.FailSuiteError = true;
    throw err;
  }
};

let _accountCache = {};
let _accountSetupCache = {};
export const _clearAccountCache = () => {
  _accountCache = {};
  _accountSetupCache = {};
};

/**
 * This callback is displayed as a global member.
 * @callback accSetuperCallback
 * @param {string} [account]
 * @returns {Promise<T>}
 * @template T
 */

/**
 * Account setup wrapper to prevent multiple setups
 * @async
 * @param {string} type
 * @param {P} setupFunc - name of the account
 * @returns {P}
 * @template T
 * @template {accSetuperCallback} P
 */
export const accSetuper = (type, setupFunc) => (account) => {
  const key = `${type}_${account ?? '<empty>'}`;
  if (_accountSetupCache[key]) return _accountSetupCache[key];
  _accountSetupCache[key] = setupFunc(account);
  return _accountSetupCache[key];
};

// Docs stuff TODO propose for upstream

// eslint-disable-next-line no-restricted-imports
import * as testing from '@onflow/flow-js-testing';

/**
 * Cached getAccountAddress from flow-js-testing
 * returns account address (creates it if necessary)
 * @param {string} accountName - name of the account
 * @returns {Promise<string>}
 */
export const getAccountAddress = async (accountName) => {
  if (_accountCache[accountName]) return _accountCache[accountName];
  _accountCache[accountName] = testing.getAccountAddress(accountName);
  return _accountCache[accountName];
};

/**
 * @typedef {object} FclEvent
 * @property {string} type
 * @property {string} transactionId
 * @property {number} transactionIndex
 * @property {number} eventIndex
 * @property {object} data
 */

/**
 * @typedef {object} FclTxResult
 * @property {string} blockId
 * @property {number} status
 * @property {string} statusString
 * @property {number} statusCode
 * @property {string} errorMessage
 * @property {FclEvent[]} events
 */

/**
 * @template T
 * @typedef {[T, null]|[null, Error]} FclResult<T>
 */
/**
 * @template T
 * @typedef {(()=> T)|T} _cb<T>
 */
/**
 * @template T
 * @callback FclPromise<T>
 * @returns {Promise<FclResult<T>>}
 */

/**
 * Ensure interaction did not throw and return result of it
 * @async
 * @param {_cb<Promise<FclResult<T>>>} ix - Promise or function to wrap
 * @returns {Promise<T>} - result of interaction
 * @throws Will throw an error if interaction runs successfully.
 * @template T
 * */
export const shallResolve = async (ix) => (await testing.shallResolve(ix))[0];
export const willResolve = shallResolve;
/**
 * Ensure **transaction** did not throw and return result of it
 * @async
 * @param {_cb<Promise<FclResult<T>>>} tx - Promise or function to wrap
 * @returns {Promise<T>} - result of transaction
 * @throws Will throw an error if transaction is reverted.
 * @template T
 * */
export const shallPass = async (tx) => (await testing.shallPass(tx))[0];
export const willPass = shallPass;
/**
 * Ensure interaction throws an error.
 * @async
 * @param {_cb<Promise<FclResult<T>>>} tx - Promise or function to wrap
 * @param {string | RegExp} [message] - Expected error message provided as either a string equality or regular expression
 * @returns {Promise<Error>} - result of interaction
 * @throws Will throw an error if interaction was successful.
 * @template T
 * */
export const shallRevert = async (tx, message) =>
  (await testing.shallRevert(tx, message))[1];
export const willRevert = shallRevert;
/**
 * Ensure interaction throws an error.
 * @async
 * @param {_cb<Promise<FclResult<T>>>} tx - Promise or function to wrap
 * @returns {Promise<Error>} - result of interaction
 * @throws Will throw an error if interaction was successful.
 * @template T
 * */
export const shallThrow = async (tx) => (await testing.shallThrow(tx))[1];
export const willThrow = shallThrow;
