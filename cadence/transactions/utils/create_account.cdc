transaction(publicKey: String) {
    prepare(admin: AuthAccount) {
        let newAccount = AuthAccount(payer: admin)
        newAccount.addPublicKey(publicKey.decodeHex())

        let address = newAccount.address
    }
}
