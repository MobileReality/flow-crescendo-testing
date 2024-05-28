import FungibleToken from "../../contracts/FungibleToken.cdc"
import FungibleTokenSwitchboard from "../../contracts/FungibleTokenSwitchboard.cdc"
import DapperUtilityCoin from "../../contracts/DapperUtilityCoin.cdc"
import FlowUtilityToken from "../../contracts/FlowUtilityToken.cdc"

transaction {
    let switchboardRef:  &FungibleTokenSwitchboard.Switchboard
    let vaultPaths: [PublicPath]

    prepare(signer: AuthAccount) {

        let ducReceiverPublicPath = /public/dapperUtilityCoinReceiver
        let futReceiverPublicPath = /public/flowUtilityTokenReceiver

        self.vaultPaths = []
        self.vaultPaths.append(ducReceiverPublicPath)
        self.vaultPaths.append(futReceiverPublicPath)

        let ducTokenVaultCapabilty = signer.getCapability<&{FungibleToken.Receiver}>(ducReceiverPublicPath)
        assert(ducTokenVaultCapabilty.check(), message: "Signer does not have a DUC receiver capability")

        let futTokenVaultCapabilty = signer.getCapability<&{FungibleToken.Receiver}>(futReceiverPublicPath)
        assert(futTokenVaultCapabilty.check(), message: "Signer does not have a FUT receiver capability")
        
        self.switchboardRef = signer.borrow<&FungibleTokenSwitchboard.Switchboard>
            (from: FungibleTokenSwitchboard.StoragePath) 
            ?? panic("Could not borrow reference to switchboard")
    }

    execute {
        self.switchboardRef.addNewVaultsByPath(paths: self.vaultPaths, address: address)
    }
}
