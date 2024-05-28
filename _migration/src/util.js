import editJsonFile from 'edit-json-file';
import * as legacy from 'sdk-legacy';
import * as stable from 'sdk-stable';
import { config, sansPrefix } from '@onflow/fcl';
import path, { join } from 'node:path';
const { glob, globSync, globStream, globStreamSync, Glob } = require('glob');
import * as fs from 'node:fs';
import {getIsLegacy} from 'fs';
import { readFile } from 'node:fs/promises';
import { getManagerAccounts } from './cdc';
import _ from 'lodash';
import { CONFIG } from './config';

export const legacyPath = path.resolve(__dirname, CONFIG.legacyPath);
export const basePath = path.resolve(__dirname, CONFIG.basePath);

export const __debug = CONFIG.debug;
export const __keepDb = CONFIG.keepDb;

export const randToken = __debug?'debug':`${Math.random().toString(36).slice(2, 8)}`;
export const workFolder = `./.flow-${randToken}`;
export const flowJsonPath = `./flow-${randToken}.json`;
export const cadenceStage = `./.cadence-stage`;

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

export const runDump = async (cmd, cwd = null) =>{
  const proc = require('node:child_process').exec(
    cmd,
    cwd ? {cwd}: undefined,
  );
  const errLogFile = __debug?null:`${workFolder}/.migrate.log.txt`;
  if(__debug) {
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  }else{
    proc.stdout.destroy();
    // TODO also used by project deploy, but that is unused.
    proc.stderr.pipe(fs.createWriteStream(errLogFile));
  }
  // if(input){
  //   proc.stdin.write(input);
  // }
  await new Promise((resolve, reject) => {
    proc.on('exit', (code)=>{
      if(code===0 || code === null){
        resolve();
      }else {
        const err = errLogFile ? fs.readFileSync(errLogFile, 'utf8') : '';
        reject(`Error ${code} while running ${cmd}\n${err}`);
      }
    });
  });
}


export const getHostParam = async (leg=true) => {
  return `--host=127.0.0.1:${leg?legacy.emulator.grpcPort:stable.emulator.grpcPort}`;
}

export const deployProject = async () => {
  await runDump(`flow project deploy ${await getHostParam()}`)
}



const { copy, outputFile } = require('fs-extra');
const preProcess = require('./preprocess');

const fixCdcPath = (name)=>{
  return './'+join(cadenceStage, 'contracts', `${name}.cdc`).replaceAll('\\', '/');
}

export const fixFlowJson = async () => {
  await copy('./flow.tpl.json', flowJsonPath);


  const flowJ = editJsonFile(flowJsonPath);
  const key = await config().get("PRIVATE_KEY");

  //
  const managerAccounts = await getManagerAccounts();
  const mappedAccNames = _.invert(managerAccounts.accounts);
  mappedAccNames[await legacy.getServiceAddress()] = 'emulator-account';
  const mappedDeployments = {};
  const mappedContracts = {};
  const foundContracts = [];
  for(const [key, value] of Object.entries(managerAccounts.contracts)){
    const name = mappedAccNames[value];
    if(!mappedDeployments[name]) mappedDeployments[name] = [];
    mappedDeployments[name].push(key);
    mappedContracts[key] = fixCdcPath(key);
    foundContracts.push(key);
  }
  //console.log(managerAccounts, mappedContracts, mappedDeployments);
  //process.exit(0);
  //console.log(flowJ.get('contracts'), flowJ.get('accounts'), flowJ.get('deployments.emulator'));
  flowJ.set('contracts', { ...flowJ.get('contracts'), ...mappedContracts} );
  const finalAcc = flowJ.get('accounts');
  for(const [name, address] of Object.entries(managerAccounts.accounts)){
    finalAcc[name] = { address, key };
  }
  flowJ.set('accounts', finalAcc);
  const finalDeploy = flowJ.get('deployments.emulator');
  for(const [key, value] of Object.entries(mappedDeployments)){
    if(!finalDeploy[key]) finalDeploy[key] = [];
    finalDeploy[key].push(...value);
  }

  flowJ.save();

  return foundContracts;

};

export const stageContracts = async () => {
  fs.rmSync(cadenceStage, { recursive: true, force: true });
  fs.mkdirSync(cadenceStage);
  fs.mkdirSync(join(cadenceStage, 'contracts'));
  const files = await glob('contracts/*.cdc', {
    cwd: basePath,
  });

  const flowJ = editJsonFile(flowJsonPath);
  const contracts = flowJ.get('contracts');
  for (const file of files) {
    const data = fs.readFileSync(join(basePath, file), 'utf8');
    await outputFile(join(cadenceStage, file), preProcess(data));

    const contractName = path.basename(file, '.cdc');
    if(!contracts[contractName]){
      contracts[contractName] = fixCdcPath(contractName);
    }
  }
  flowJ.set('contracts', contracts);
  flowJ.save();
}

import {_clearAccountCache as _clearAccountCacheStable, getAccountAddress as getAccountAddressStable} from 'testing-stable/src/test-utils';
import {_clearAccountCache as _clearAccountCacheLegacy, getAccountAddress as getAccountAddressLegacy} from 'testing-legacy/src/test-utils';

let _accountCache = {};
let _accountSetupCache = {};
export const _clearAccountCache = () => {
  _accountCache = {};
  _accountSetupCache = {};
  _clearAccountCacheStable();
  _clearAccountCacheLegacy();
};

/**
 * Cached getAccountAddress from flow-js-testing
 * returns account address (creates it if necessary)
 * @param {string} accountName - name of the account
 * @returns {Promise<string>}
 */
export const getAccountAddress = async (accountName) => {
    if (_accountCache[accountName]) return _accountCache[accountName];
    _accountCache[accountName] = await (getIsLegacy?getAccountAddressLegacy:getAccountAddressStable)(accountName);
    return _accountCache[accountName];
  };
