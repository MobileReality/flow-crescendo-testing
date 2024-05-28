// This script reads the balance field's of multiple accounts FlowToken Balance

import FlowToken from "../../contracts/FlowToken.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"

pub fun main(accounts: [Address]): [UFix64?] {
    var results: [UFix64?] = []
    for account in accounts {
        let vaultRef = getAccount(account)
            .getCapability(/public/flowTokenBalance)
            .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
            ?? nil
        if vaultRef == nil {
            results.append(nil)
        } else {
            results.append(vaultRef!.balance)
        }
    }
    return results
}
