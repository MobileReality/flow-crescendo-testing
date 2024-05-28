// Code includes
jest.mock('fs', () => {
  const path = jest.requireActual('node:path');
  const { getTemplate: legacyGetTemplate } = jest.requireActual(
    'sdk-legacy',
  );
  const { getTemplate: stableGetTemplate } = jest.requireActual(
    'sdk-stable',
  );
  const original = jest.requireActual('fs');
  const preProcess = jest.requireActual('./preprocess');
  const { CONFIG } = jest.requireActual('./config');

  const includeRegex = /^\s*include\s*"?([^\s"]*)"?.*$/gimu;
  const importRegex =
    /^\s*import\s+(([\w\d]+\s*,\s*)*[\w\d]+)\s+from\s*([\w\d".\\/]+).*$\n?/gimu;
  const importContractRegex = /(\w+)/gu;
  const stablePath = path.resolve(__dirname, CONFIG.basePath);
  const legacyPath = path.resolve(__dirname, CONFIG.legacyPath);
  let isLegacy = true;
  const basePath = ()=>{
    return isLegacy ? legacyPath : stablePath;
  }
  const setIsLegacy = (_isLegacy) => {
    if(isLegacy === _isLegacy) return;
    clearCodeCache();
    isLegacy = _isLegacy;
  };
  const getIsLegacy = ()=>isLegacy;
  const originalGetTemplate = (...args) =>
    isLegacy ? legacyGetTemplate(...args) : stableGetTemplate(...args);
  const loadedCodeCache = {};

  const clearCodeCache = ()=>{
    for (const key in loadedCodeCache){
      if (loadedCodeCache.hasOwnProperty(key)){
        delete loadedCodeCache[key];
      }
    }
  }

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
    const relaPath = path.relative(basePath(), _path);
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
    return originalGetTemplate(file, addressMap, byAddress);
  };

  const readFileSync = (_path, options) => {
    if (loadedCodeCache[_path]) return loadedCodeCache[_path];
    let result = original.readFileSync(_path, options);
    // Only replace in .cdc files
    if (path.parse(_path)?.ext?.toLowerCase() !== '.cdc') {
      return result;
    }
    result = preProcess(result);
    // TODO move rest to pre-process
    // Parse includes
    result = result.replaceAll(
      includeRegex,
      (match, include, offset, input) => {
        let includePath = include;
        if (!path.isAbsolute(includePath)) {
          includePath = path.join(
            includePath[0] === '.' ? path.dirname(_path) : path.join(basePath(), 'includes'),
            includePath,
          );
        }
        if (
          !isSubPath(basePath(), includePath) &&
          process.env.INSECURE_INCLUDE !== 'true'
        ) {
          includeError(
            _path,
            input,
            offset,
            `File traversal outside of basePath: ${path.relative(
              basePath(),
              includePath,
            )}`,
          );
        }
        try {
          return originalGetTemplate(includePath, savedAddressMap);
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
              basePath(),
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
    setIsLegacy,
    getIsLegacy,
  };
});
