/** 
  This transaction is for local development purposes only.
  It provides test util for automated tests.
*/

transaction(contractName: String, code: String) {

    prepare(serviceAccount: AuthAccount) {
        let contract = serviceAccount.contracts.get(name: contractName)
        if contract == nil {
            serviceAccount.contracts.add(name: contractName, code: code.decodeHex(), adminAccount: serviceAccount)
        } else {
            serviceAccount.contracts.update__experimental(name: contractName, code: code.decodeHex())
        }
    }
}
