import TestUtils from "../../contracts/TestUtils.cdc"

pub fun main(): UFix64 {
    return TestUtils.blockTimestamp
}