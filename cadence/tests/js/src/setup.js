import * as matchers from 'jest-extended';
expect.extend(matchers);
import path from 'node:path';
import { config } from '@onflow/fcl';
const basePath = path.resolve(__dirname, '../../../');

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

// Code includes
jest.mock('fs', () => {
  const path = jest.requireActual('node:path');
  const testing = jest.requireActual('@onflow/flow-js-testing');
  const original = jest.requireActual('fs');

  const includeRegex = /^\s*include\s*"?([^\s"]*)"?.*$/gimu;
  const importRegex =
    /^\s*import\s+(([\w\d]+\s*,\s*)*[\w\d]+)\s+from\s*([\w\d".\\/]+).*$\n?/gimu;
  const importContractRegex = /(\w+)/gu;
  const basePath = path.resolve(__dirname, '../../../');
  const baseIncludesPath = path.join(basePath, 'includes');
  const loadedCodeCache = {};

  const simplifyImports = (code) => {
    const imports = [...code.matchAll(importRegex)].reduce(
      (contracts, match) => {
        const contractsStr = match[1];
        const address = match[3];

        for (const contract of contractsStr.match(importContractRegex) ?? []) {
          contracts[contract] = address;
        }
        return contracts;
      },
      {},
    );
    code = code.replaceAll(importRegex, '');
    // TODO sorting?
    code = `${Object.entries(imports)
      .map(([contract, address]) => `import ${contract} from ${address}`)
      .join('\n')}\n${code}`;
    return code;
  };

  const isSubPath = (parent, dir) => {
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  };
  const offsetLineNumber = (data, index) => {
    const perLine = data.split('\n');
    let total_length = 0;
    for (const [i, element] of perLine.entries()) {
      total_length += element.length;
      if (total_length >= index) return i + 1;
    }
  };
  const includeError = (_path, input, offset, error) => {
    const relaPath = path.relative(basePath, _path);
    const lineNumber = offsetLineNumber(input, offset);
    throw new Error(
      `Error loading include of ${relaPath} line ${lineNumber} : ${error}`,
    );
  };
  let savedAddressMap = {};
  const saveAddressMapProxy =
    (target) =>
    ({ name, addressMap }) => {
      savedAddressMap = addressMap ?? {};
      return target({ name, addressMap });
    };
  const getTemplate = (file, addressMap = {}, byAddress = false) => {
    savedAddressMap = addressMap;
    return testing.getTemplate(file, addressMap, byAddress);
  };

  const readFileSync = (_path, options) => {
    if (loadedCodeCache[_path]) return loadedCodeCache[_path];
    let result = original.readFileSync(_path, options);
    // Only replace in .cdc files
    if (path.parse(_path)?.ext?.toLowerCase() !== '.cdc') {
      return result;
    }
    // Parse includes
    result = result.replaceAll(
      includeRegex,
      (match, include, offset, input) => {
        let includePath = include;
        if (!path.isAbsolute(includePath)) {
          includePath = path.join(
            includePath[0] === '.' ? path.dirname(_path) : baseIncludesPath,
            includePath,
          );
        }
        if (
          !isSubPath(basePath, includePath) &&
          process.env.INSECURE_INCLUDE !== 'true'
        ) {
          includeError(
            _path,
            input,
            offset,
            `File traversal outside of basePath: ${path.relative(
              basePath,
              includePath,
            )}`,
          );
        }
        try {
          return testing.getTemplate(includePath, savedAddressMap);
        } catch (err) {
          const errMsg =
            err.code === 'ENOENT'
              ? 'File does not exist'
              : `${err.code} ${err.message}`;

          includeError(
            _path,
            input,
            offset,
            `Could not load file ${path.relative(
              basePath,
              includePath,
            )} - ${errMsg}`,
          );
        }
      },
    );
    result = simplifyImports(result);
    loadedCodeCache[_path] = result;
    return result;
  };
  return {
    ...original,
    readFileSync,
    getTemplate,
    getContractCode: saveAddressMapProxy(testing.getContractCode),
    getTransactionCode: saveAddressMapProxy(testing.getTransactionCode),
    getScriptCode: saveAddressMapProxy(testing.getScriptCode),
  };
});
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
      await emulator.start({ logging });

      // because new emulator is sometimes not nice
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
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
