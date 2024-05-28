import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../contracts/ExampleNFT2.cdc"
import MetadataViews from "../contracts/MetadataViews.cdc"

/// This transaction is what an account would run
/// to set itself up to receive NFTs

transaction {

    prepare(signer: AuthAccount) {
        // Return early if the account already has a collection
        if signer.borrow<&ExampleNFT2.Collection>(from: ExampleNFT2.CollectionStoragePath) != nil {
            return
        }

        // Create a new empty collection
        let collection <- ExampleNFT2.createEmptyCollection()

        // save it to the account
        signer.save(<-collection, to: ExampleNFT2.CollectionStoragePath)

        // create a public capability for the collection
        signer.link<&{NonFungibleToken.CollectionPublic, ExampleNFT2.ExampleNFTCollectionPublic, MetadataViews.ResolverCollection}>(
            ExampleNFT2.CollectionPublicPath,
            target: ExampleNFT2.CollectionStoragePath
        )
    }
}
