import FlowManager from 0x01

pub fun main(man: Address): {String: Address} {
    let pubAccount = getAccount(man)
    let accountManager = pubAccount
        .getCapability(FlowManager.accountManagerPath)
        .borrow<&FlowManager.Mapper>()!

    return accountManager.accounts
}


