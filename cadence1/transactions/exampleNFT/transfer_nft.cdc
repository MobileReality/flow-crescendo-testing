import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../contracts/ExampleNFT2.cdc"

/// This transaction is for transferring and NFT from
/// one account to another

transaction(recipient: Address, withdrawID: UInt64) {

    /// Reference to the withdrawer's collection
    let withdrawRef: auth(NonFungibleToken.Withdraw) &ExampleNFT2.Collection

    /// Reference of the collection to deposit the NFT to
    let depositRef: &{NonFungibleToken.CollectionPublic}

    prepare(signer: auth(NonFungibleToken.Withdraw, BorrowValue) &Account) {
        // borrow a reference to the signer's NFT collection
        self.withdrawRef = signer
            .storage.borrow<auth(NonFungibleToken.Withdraw) &ExampleNFT2.Collection>(from: ExampleNFT2.CollectionStoragePath)
            ?? panic("Account does not store an object at the specified path")

        // get the recipients public account object
        let recipient = getAccount(recipient)

        // borrow a public reference to the receivers collection
        self.depositRef = recipient
            .capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(ExampleNFT2.CollectionPublicPath)
            ?? panic("Could not borrow a reference to the receiver's collection")

    }

    execute {

        // withdraw the NFT from the owner's collection
        let nft <- self.withdrawRef.withdraw(withdrawID: withdrawID)

        // Deposit the NFT in the recipient's collection
        self.depositRef.deposit(token: <-nft)
    }

    post {
        !self.withdrawRef.getIDs().contains(withdrawID): "Original owner should not have the NFT anymore"
        self.depositRef.getIDs().contains(withdrawID): "The reciever should now own the NFT"
    }
}
