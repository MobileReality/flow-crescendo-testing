import * as matchers from 'jest-extended';
expect.extend(matchers);

import { config } from '@onflow/fcl';
import { CONFIG } from './config';

import '../src/_hooks';
import {
  basePath,
  legacyPath,
  stageContracts,
  workFolder,
  runDump,
  getHostParam,
  cadenceStage,
  fixFlowJson, __debug, __keepDb, _clearAccountCache, randToken, flowJsonPath, trySkipSuite,
} from './util';

import * as legacy from 'sdk-legacy';
import * as stable from 'sdk-stable';

jest.mock('child_process', () => {
  const { CONFIG } = jest.requireActual('./config');
  const original = jest.requireActual('child_process');
  const spawn = (...args) => {
    const cmd = args[0];
    const flags = args[1];
    if(!flags.includes('--skip-tx-validation')){ flags.push('--skip-tx-validation'); }
    flags.push('--contracts');
    flags.push('--persist');
    if(CONFIG.emulator.transactionFees)
      flags.push('--transaction-fees=true');
    flags.push('--min-account-balance=0.1')
    //console.trace(cmd, flags);
    try {
      //return original.spawn(cmd, flags);
      return original.spawn(cmd==='flow'?CONFIG.flowCmd:cmd, flags);
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
import fs from 'node:fs';
import xfs from 'fs';
const { copy, outputFile } = require('fs-extra');
import path from 'node:path';
import { checkMigrationReport } from './report';

beforeAll(async () => {
  try {
    if(!fs.existsSync('./flow.json')){
      await copy('./flow.tpl.json', './flow.json');
    }
    _clearAccountCache();
    config().put('fcl.limit', 999);
    await legacy.init(legacyPath);
    if(__debug) console.log('starting legacy emulator');
    await legacy.emulator.start({
      logging: false,
      signatureCheck: true,
      flags: `--dbpath=${workFolder}`,
    });
    if(__debug) console.log('started legacy emulator');
    //console.log(await fcl.config().all());

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
    if(CONFIG.deployFDNZ)
    await legacy.shallPass(legacy.deployContractByName({name: 'FDNZ', to: await legacy.getServiceAddress()}));
    // await legacy.shallPass(legacy.mintFlow("0ae53cb6e3f42a79", '10000.0'));
    // await deployProject();
  }catch(e){
    console.trace(e);
    throw e;
  }
});


afterAll(async () => {
  // _clearAccountCache();
  try {
    if(__debug) console.log('stopping emulator');
    await stable.emulator.stop();
  } catch {
    // ignore
  }
  try {
    if(__debug) console.log('stopping legacy emulator');
    await legacy.emulator.stop();
  } catch {
    // ignore
  }
  if(!__debug && !__keepDb) {
    fs.rmSync(cadenceStage, { recursive: true, force: true });
    fs.rmSync(workFolder, { recursive: true, force: true });
    fs.rmSync(flowJsonPath, { recursive: true, force: true });
  }
});

const performMigration = async (contracts=[]) => {
  const foundContracts = await fixFlowJson();
  if(contracts.length === 0){
    contracts = foundContracts;
  }
  const ownContracts = contracts;
  if(!contracts.includes('FlowManager'))
    contracts.push('FlowManager');
  if(CONFIG.deployFDNZ && !contracts.includes('FDNZ'))
    contracts.push('FDNZ');

  // this is only for test/main-net?
  // for(const contract of contracts){
  //   await runDump(`flow-c1 migrate stage-contract ${await getHostParam()} ${contract}`);
  // }

  legacy.emulator.process.kill('SIGINT');
  legacy.emulator.initialized = false;

  await stageContracts();
  try {
    const dbFile = path.join(workFolder, 'emulator.sqlite').replaceAll('\\', '/');
    const backupPath = path.join(workFolder, 'backup').replaceAll('\\', '/');
    fs.mkdirSync(backupPath);
    await copy(dbFile, path.join(backupPath, 'emulator.sqlite').replaceAll('\\', '/'));
  }catch(e){
    console.trace(e);
  }


   /** /
   console.log(contracts, ownContracts);
   console.log(`flow-c1 migrate state --skip-version-check --config-path=${flowJsonPath} --db-path ${workFolder} --contracts="${contracts.join(',')}" --save-report=./.reports`);
   process.exit(0);
   // **/
  const reportPath = `./${workFolder}/.reports/`;
  const cmd = `${CONFIG.flowC1Cmd} migrate state --skip-version-check --config-path=${flowJsonPath} --db-path ${workFolder} --contracts="${contracts.join(',')}" --save-report=${reportPath}`;
  fs.writeFileSync(`${workFolder}/.migrate.cmd.txt`, cmd, 'utf8');
  await runDump(cmd);

  checkMigrationReport(ownContracts, reportPath);

  xfs.setIsLegacy(false);
  await stable.init(basePath);
  await stable.emulator.start({
    logging: false,
    execName: CONFIG.flowC1Cmd,
    flags: `--dbpath=${workFolder}`,
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
  if(CONFIG.deployFDNZ)
  await stable.shallPass(stable.deployContractByName({name: 'FDNZ', to: await legacy.getServiceAddress(), update: true}));
};
describe.performMigration = () => it('MUST migrate state ===================', () => trySkipSuite(async () => {
   await performMigration();
 }));


