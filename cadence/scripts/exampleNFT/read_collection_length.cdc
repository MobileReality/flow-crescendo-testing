import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import ExampleNFT2 from "../../contracts/ExampleNFT2.cdc"

pub fun main(address: Address): Int {
    let account = getAccount(address)

    let collectionRef = account.getCapability(ExampleNFT2.CollectionPublicPath)!
        .borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")

    return collectionRef.getIDs().length
}
