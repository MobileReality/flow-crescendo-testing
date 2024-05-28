import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../../contracts/ExampleNFT2.cdc"

pub fun main(address: Address): Int {
    let account = getAuthAccount<auth(BorrowValue) &Account>(address)

    let collectionRef = account.storage.borrow<&ExampleNFT2.Collection>(from: ExampleNFT2.CollectionStoragePath)
        ?? panic("Could not borrow public collection")

    return collectionRef.getIDs().length
}
