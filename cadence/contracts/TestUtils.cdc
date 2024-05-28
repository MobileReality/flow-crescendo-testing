/** 
  This contract implementation is for local development purposes only.
  It provides test utils for automated tests.
*/

pub contract TestUtils {

    pub event BlockTimestampChanged(timestamp: UFix64)

    pub var blockTimestamp: UFix64;

    pub fun setBlockTimestamp(_ timestamp: UFix64) {
        self.blockTimestamp = timestamp
        emit TestUtils.BlockTimestampChanged(timestamp: timestamp)
    }

    pub fun getBlockTimestamp(): UFix64 {
        return self.blockTimestamp
    }

    init() {
        self.blockTimestamp = 0.0
    }
}