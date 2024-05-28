/// This script uses the NFTMinter resource to mint a new NFT
/// It must be run with the account that has the minter resource
/// stored in /storage/NFTMinter
///
/// The royalty arguments indicies must be aligned

import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../../contracts/ExampleNFT2.cdc"
import MetadataViews from "../../contracts/MetadataViews.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"

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
    let recipientCollectionRef: &{NonFungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {

        let collectionData = ExampleNFT2.resolveContractView(resourceType: nil, viewType: Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?
            ?? panic("ViewResolver does not resolve NFTCollectionData view")

        // borrow a reference to the NFTMinter resource in storage
        self.minter = signer.storage.borrow<&ExampleNFT2.NFTMinter>(from: ExampleNFT2.MinterStoragePath)
            ?? panic("Account does not store an object at the specified path")

        // Borrow the recipient's public NFT collection reference
        self.recipientCollectionRef = getAccount(recipient).capabilities.borrow<&{NonFungibleToken.Receiver}>(
                collectionData.publicPath
            ) ?? panic("Could not get receiver reference to the NFT Collection")
    }

    execute {

        // Create the royalty details
        var royalties2: [MetadataViews.Royalty] = []
        for receiver in royalties.keys {
            let royaltyPercentage = royalties[receiver]!
            let beneficiaryCapability = getAccount(receiver).capabilities.get<&{FungibleToken.Receiver}>(
                MetadataViews.getRoyaltyReceiverPublicPath()
            )

            if !beneficiaryCapability.check() {
                panic("Beneficiary does not have Receiver configured at RoyaltyReceiverPublicPath")
            }

            royalties2.append(
                MetadataViews.Royalty(
                    receiver: beneficiaryCapability,
                    cut: royaltyPercentage / 100.0,
                    description: ""
                )
            )
        }


        // Mint the NFT and deposit it to the recipient's collection
        let mintedNFT <- self.minter.mintNFT(
            name: name,
            description: description,
            thumbnail: thumbnail,
            royalties: royalties2
        )
        self.recipientCollectionRef.deposit(token: <-mintedNFT)
    }

}
