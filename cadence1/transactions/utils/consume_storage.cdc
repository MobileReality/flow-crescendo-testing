import FlowToken from "../../contracts/FlowToken.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"

transaction(flowTokenSink: Address) {
    prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
        let sentVault <- vaultRef!.withdraw(amount: signer.availableBalance)
        let receiverRef = getAccount(flowTokenSink).getCapability(/public/flowTokenReceiver)!.borrow<&{FungibleToken.Receiver}>()
        receiverRef!.deposit(from: <-sentVault)
        var i = 0
        while signer.storageCapacity > signer.storageUsed {
          signer.save(<- FlowToken.createEmptyVault(), to: StoragePath(identifier: "storageConsumer_".concat(i.toString()))!)
          i = i + 1
        }
        while signer.storageCapacity < signer.storageUsed {
            destroy <-signer.load<@FungibleToken.Vault>(from: StoragePath(identifier: "storageConsumer_".concat(i.toString()))!)
          i = i - 1
        }

    }
}
