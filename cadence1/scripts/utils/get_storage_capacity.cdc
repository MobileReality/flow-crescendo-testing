pub fun main(account: Address): UInt64 {

    let pubAccount = getAccount(account)

    return pubAccount.storageCapacity
}