import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../contracts/ExampleNFT2.cdc"
import MetadataViews from "../contracts/MetadataViews.cdc"

/// This transaction is what an account would run
/// to set itself up to receive NFTs

transaction {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        // Return early if the account already has a collection
        if signer.storage.borrow<&ExampleNFT2.Collection>(from: ExampleNFT2.CollectionStoragePath) == nil {
            // Create a new empty collection
            let collection <- ExampleNFT2.createEmptyCollection(nftType: Type<@ExampleNFT2.NFT>())

            // save it to the account
            signer.storage.save(<-collection, to: ExampleNFT2.CollectionStoragePath)
        }

        // create a public capability for the collection
        signer.capabilities.unpublish(ExampleNFT2.CollectionPublicPath)
        let collectionCap = signer.capabilities.storage.issue<&ExampleNFT2.Collection>(ExampleNFT2.CollectionStoragePath)
        signer.capabilities.publish(collectionCap, at: ExampleNFT2.CollectionPublicPath)
    }
}
