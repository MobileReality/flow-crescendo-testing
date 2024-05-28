import JSON5 from 'json5';
import _ from 'lodash';
import path from 'path';
import fs from 'node:fs';

/**
 * @typedef ConfigEmulator
 * @property {boolean} transactionFees
 */
/**
 * @typedef Config
 * @property {boolean} debug
 * @property {boolean} keepDb
 * @property {ConfigEmulator} emulator
 * @property {string} legacyPath
 * @property {string} basePath
 * @property {string} flowCmd
 * @property {string} flowC1Cmd
 * @property {boolean} deployFDNZ
 *
 */
/**
 * @type Config
 */
const defaults = {
  debug: false,
  keepDb: false,

  deployFDNZ: true,

  emulator: {
    transactionFees: false,
  },

  legacyPath: '../../cadence',
  basePath: '../../cadence1',

  flowCmd: 'flow',
  flowC1Cmd: 'flow-c1',

};

const basePath = path.resolve(__dirname, '..');
const baseConfig = JSON5.parse(fs.readFileSync(`${basePath}/config.json5`, 'utf8'));
const userConfig = fs.existsSync(`${basePath}/config.local.json5`)?JSON5.parse(fs.readFileSync(`${basePath}/config.local.json5`, 'utf8')):{};



/**
 * @type Config
 */
export const CONFIG = _.merge(defaults, baseConfig, userConfig);
export default CONFIG;


export const CONFIG_GEN = (full=true)=>{
  fs.writeFileSync(`${basePath}/config.gen.json5`, JSON5.stringify(full?CONFIG:defaults, null, 2), 'utf8')
}

// CONFIG_GEN();
// console.log(CONFIG);
