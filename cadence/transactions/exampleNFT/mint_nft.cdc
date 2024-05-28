import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../contracts/ExampleNFT2.cdc"
import MetadataViews from "../contracts/MetadataViews.cdc"
import FungibleToken from "./utility/FungibleToken.cdc"

/// This script uses the NFTMinter resource to mint a new NFT
/// It must be run with the account that has the minter resource
/// stored in /storage/NFTMinter

transaction(
    recipient: Address,
    name: String,
    description: String,
    thumbnail: String,
    royalties: {Address:UFix64},
    additionalInfo: {String: String}
) {

    /// local variable for storing the minter reference
    let minter: &ExampleNFT2.NFTMinter

    /// Reference to the receiver's collection
    let recipientCollectionRef: &{NonFungibleToken.CollectionPublic}

    /// Previous NFT ID before the transaction executes
    let mintingIDBefore: UInt64

    prepare(signer: AuthAccount) {
        self.mintingIDBefore = ExampleNFT2.totalSupply

        // borrow a reference to the NFTMinter resource in storage
        self.minter = signer.borrow<&ExampleNFT2.NFTMinter>(from: ExampleNFT2.MinterStoragePath)
            ?? panic("Account does not store an object at the specified path")

        // Borrow the recipient's public NFT collection reference
        self.recipientCollectionRef = getAccount(recipient)
            .getCapability(ExampleNFT2.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")
    }

    execute {

        // Create the royalty details
        var royalties2: [MetadataViews.Royalty] = []
        for receiver in royalties.keys {
            let royaltyPercentage = royalties[receiver]!
            let beneficiaryCapability = getAccount(receiver)
            .getCapability<&{FungibleToken.Receiver}>(MetadataViews.getRoyaltyReceiverPublicPath())

            // Make sure the royalty capability is valid before minting the NFT
            if !beneficiaryCapability.check() { panic("Beneficiary capability is not valid!") }

            royalties2.append(
                MetadataViews.Royalty(
                    receiver: beneficiaryCapability,
                    cut: royaltyPercentage / 100.0,
                    description: ""
                )
            )
        }



        // Mint the NFT and deposit it to the recipient's collection
        self.minter.mintNFT(
            recipient: self.recipientCollectionRef,
            name: name,
            description: description,
            thumbnail: thumbnail,
            royalties: royalties2
        )
    }

    post {
        self.recipientCollectionRef.getIDs().contains(self.mintingIDBefore): "The next NFT ID should have been minted and delivered"
        ExampleNFT2.totalSupply == self.mintingIDBefore + 1: "The total supply should have been increased by 1"
    }
}
