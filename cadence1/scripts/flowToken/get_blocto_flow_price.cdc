import FlowSwapPair from "../../contracts/FlowSwapPair.cdc"
import FusdUsdtSwapPair from "../../contracts/FusdUsdtSwapPair.cdc"

// In FlowSwapPair (FLOW <> tUSDT)
// Token1: FLOW
// Token2: tUSDT
pub fun main(amount: UFix64): [UFix64] {
  let poolAmounts = FlowSwapPair.getPoolAmounts()
  let fusdPrice1 = FlowSwapPair.quoteSwapExactToken2ForToken1(amount: amount * (1.0 - FlowSwapPair.feePercentage))
  let fusdPrice2 = FlowSwapPair.quoteSwapToken1ForExactToken2(
    amount: FusdUsdtSwapPair.quoteSwapToken2ForExactToken1(amount: amount)
  ) / (1.0 - FlowSwapPair.feePercentage)
  let flowPrice1 = FlowSwapPair.quoteSwapExactToken1ForToken2(amount: amount * (1.0 - FlowSwapPair.feePercentage))
  let flowPrice2 = (poolAmounts.token2Amount / poolAmounts.token1Amount)
    * (1.0 - FlowSwapPair.feePercentage)

  return [flowPrice1, flowPrice2, fusdPrice1, fusdPrice2]
}
