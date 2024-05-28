pub fun main(account: Address, keyIndex: Int): AccountKey? {

    let pubAccount = getAccount(account)

    return pubAccount.keys.get(keyIndex: keyIndex)
}
