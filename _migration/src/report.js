import { globSync } from 'glob';
import path from 'path';
import _ from 'lodash';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';


export const checkMigrationReport = (contracts, reportPath)=> {
  const foundLogs = globSync(`${reportPath}*.json`, {}).map(f=>_.trim(path.relative(reportPath, f), './\\'));
  const checkingF = foundLogs.find(f=>f.startsWith('contract-checking'));
  const stagedF = foundLogs.find(f=>f.startsWith('staged-contracts-migr')); // older versions use different naming, this finds both
  const checking = JSON.parse(readFileSync(`${reportPath}/${checkingF}`, 'utf8')).filter(e => contracts.includes(e.name));
  const staged = JSON.parse(readFileSync(`${reportPath}/${stagedF}`, 'utf8')).filter(e => contracts.includes(e.contract_name));
  let cErr = 0, mErr = 0;
  let hadError = false;
  for (const stagedElement of staged) {
    if (stagedElement.kind !== 'contract-update-success') {
      console.log(chalk.red(`Migration error in ${stagedElement.contract_name} @ ${stagedElement.account_address}:`))
      console.log(stagedElement.error);
      hadError = true;
      mErr++;
    }
  }
  for (const checkingElement of checking) {
    if (checkingElement.error) {
      console.log(chalk.red(`Checking error in ${checkingElement.name} @ ${checkingElement.address}:`));
      console.log(checkingElement.error);
      hadError = true;
      cErr++;
    }
  }
  if(hadError) throw new Error(`Migration failed with ${mErr} migration errors and ${cErr} checking errors`);
}
