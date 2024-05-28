/** 
  This transaction is for local development purposes only.
  It provides test util for automated tests.
*/

import TestUtils from "../../contracts/TestUtils.cdc"

transaction(timestamp: UFix64) {
    prepare(signer: AuthAccount) {
        TestUtils.setBlockTimestamp(timestamp)
    }
}