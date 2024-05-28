transaction(contractName: String, code: String) {
    prepare(contractAccount: auth(AddContract, UpdateContract) &Account) {
        let cntract = contractAccount.contracts.get(name: contractName)
        if cntract == nil {
            contractAccount.contracts.add(
                name: contractName,
                code: code.decodeHex()
            )
        } else {
            contractAccount.contracts.update(name: contractName, code: code.decodeHex())
        }
    }
}
