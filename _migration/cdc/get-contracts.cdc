import FlowManager from 0x01

pub fun main(man: Address): {String: Address} {
    let pubAccount = getAccount(man)
    let accountManager = pubAccount
        .getCapability(FlowManager.contractManagerPath)
        .borrow<&FlowManager.Mapper>()!

    return accountManager.accounts
}


