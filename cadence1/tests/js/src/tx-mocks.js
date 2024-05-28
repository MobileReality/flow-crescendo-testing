import { lowerFirst } from 'lodash';

export const mockedInteractions = {};
export function _cdcMockFilter(input){ return input.trim().replaceAll(/\r/gimu, '') }
function mock(input, output){
  mockedInteractions[_cdcMockFilter(input)] = output;
}
import { join } from 'path';
import {globSync} from 'glob';
import { readFileSync } from 'node:fs';

const ORIGINAL_PATH = join(__dirname, '../node_modules/@onflow/flow-js-testing/cadence/');
const MOCKED_PATH = join(__dirname, '../mocked-cdc/cadence/');

const etPattern = /(ExampleToken)/gi

export function loadTxMocks() {
  const mocks = globSync('**/*.cdc', {cwd: MOCKED_PATH.replace(/\\/g, '/')});
  const originals = globSync('**/*.cdc', { cwd: ORIGINAL_PATH.replace(/\\/g, '/')});
  mocks.map(async(mockFile) => {
    let orig, mocked;
    try {
      orig = readFileSync(join(ORIGINAL_PATH, mockFile), 'ascii')
    }catch(err){
      console.error('Could not read original file to mock:', mockFile, err);
      process.exit(1);
    }
    try {
      mocked = readFileSync(join(MOCKED_PATH, mockFile), 'ascii')
    }catch(err){
      console.error('[FlowJsTestingMocker] Could not read original file to mock:', mockFile, err);
      process.exit(1);
    }
    mock(orig, mocked);
    mock(orig.replaceAll(/access\(all\)/gimu, 'pub'), mocked)
    if(orig.indexOf('xampleToken')!==-1) {
      mock(orig.replaceAll(etPattern, match => match === "ExampleToken" ? 'FlowToken' : 'flowToken'))
    }
    if(orig.indexOf('access(all) fun main')!==-1) {
      mock(orig.replaceAll(/access(all) fun main/gimu, 'pub fun main'), mocked);
    }
  })
  if (mocks.length !== originals.length) {
    console.warn('[FlowJsTestingMocker] The number of original files does not match the number of mocked files');
  }
}

export const injectedFlowImportMap = {
  FlowToken: "0x0ae53cb6e3f42a79",
  FungibleToken: "0xee82856bf20e2aa6",
  FungibleTokenMetadataViews: "0xee82856bf20e2aa6",
  FungibleTokenSwitchboard: "0xee82856bf20e2aa6",
  FlowFees: "0xe5a8b7f23e8b548f",
  FlowStorageFees: "0xf8d6e0586b0a20c7",

  FlowIDTableStaking: "0xf8d6e0586b0a20c7",
  FlowEpoch: "0xf8d6e0586b0a20c7",
  FlowClusterQC: "0xf8d6e0586b0a20c7",
  FlowDKG: "0xf8d6e0586b0a20c7",
  FlowStakingCollection: "0xf8d6e0586b0a20c7",

  FlowServiceAccount: "0xf8d6e0586b0a20c7",
  RandomBeaconHistory: "0xf8d6e0586b0a20c7",
  NodeVersionBeacon: "0xf8d6e0586b0a20c7",

  EVM: "0xf8d6e0586b0a20c7",

  FUSD: "0xf8d6e0586b0a20c7",
  NonFungibleToken: "0xf8d6e0586b0a20c7",
  MetadataViews: "0xf8d6e0586b0a20c7",
  ViewResolver: "0xf8d6e0586b0a20c7",
  NFTStorefront: "0xf8d6e0586b0a20c7",
  NFTStorefrontV2: "0xf8d6e0586b0a20c7",
};

// flow-cadut
mock(`
    transaction(name: String, code: String) {
      prepare(acct: AuthAccount){
        let decoded = code.decodeHex()
        
        acct.contracts.add(
          name: name,
          code: decoded,
        )
      }
    }
  `,`
    transaction(name: String, code: String) {
      prepare(acct: auth(AddContract) &Account) {
        let decoded = code.decodeHex()
        
        acct.contracts.add(
          name: name,
          code: decoded,
        )
      }
    }
  `);

mock(`
  transaction(name: String, code: String){
    prepare(acct: AuthAccount){
      let decoded = code.decodeHex()
      
      if acct.contracts.get(name: name) == nil {
        acct.contracts.add(name: name, code: decoded)
      } else {
        acct.contracts.update__experimental(name: name, code: decoded)
      }
    }
  }
`,`
  transaction(name: String, code: String){
      prepare(acct: auth(AddContract, UpdateContract) &Account) {
      let decoded = code.decodeHex()
      
      if acct.contracts.get(name: name) == nil {
        acct.contracts.add(name: name, code: decoded)
      } else {
        acct.contracts.update(name: name, code: decoded)
      }
    }
  }
`)

