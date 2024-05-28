transaction(contractName: String) {

    prepare(tunegoContractsAccount: AuthAccount) {
        tunegoContractsAccount.contracts.remove(name: contractName)
    }
}