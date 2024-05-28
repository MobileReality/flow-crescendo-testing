import * as matchers from 'jest-extended';
expect.extend(matchers);
import path from 'node:path';
const basePath = path.resolve(__dirname, '../../../');

import { config } from '@onflow/fcl';

jest.mock('child_process', () => {
  const original = jest.requireActual('child_process');
  const spawn = (...args) => {
    const cmd = args[0];
    const flags = args[1];
    if(!flags.includes('--skip-tx-validation')){ flags.push('--skip-tx-validation'); }
    if(!flags.includes('--contracts')){ flags.push('--contracts'); }
    try {
      return original.spawn(cmd, flags);
    }catch(e){
      console.trace(e);
      throw e;
    }
  };
  return {
    ...original,
    spawn,
  };
});

import './_hooks';
import { emulator, init } from '@onflow/flow-js-testing';
import { _clearAccountCache } from './test-utils';

export const originalDescribe = describe;
// eslint-disable-next-line no-global-assign
describe = (name, callback, type = null) => {
  const mode = name.parallel !== true;
  if (name.name) name = name.name;
  const call =
    type === null
      ? originalDescribe
      : type === false
      ? originalDescribe.skip
      : originalDescribe.only;
  call(name, () => {
    (mode ? beforeEach : beforeAll)(async () => {
      _clearAccountCache();
      const logging = false;

      config().put('fcl.limit', 999);
      await init(basePath);
      await emulator.start({ logging, execName: 'flow-c1' });

      // because new emulator is sometimes not nice
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
      //await deployManager();
    });

    (mode ? afterEach : afterAll)(async () => {
      _clearAccountCache();
      try {
        await emulator.stop();
      } catch {
        // ignore
      }
    });
    callback();
  });
};
describe.skip = (name, callback) => describe(name, callback, false);
describe.only = (name, callback) => describe(name, callback, true);
describe.original = originalDescribe;
