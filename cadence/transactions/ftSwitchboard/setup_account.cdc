import FungibleTokenSwitchboard from "../../contracts/FungibleTokenSwitchboard.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"

transaction {

    prepare(acct: AuthAccount) {

        if acct.borrow<&FungibleTokenSwitchboard.Switchboard>
          (from: FungibleTokenSwitchboard.StoragePath) == nil {
            
            acct.save(
                <- FungibleTokenSwitchboard.createSwitchboard(), 
                to: FungibleTokenSwitchboard.StoragePath)

            acct.link<&FungibleTokenSwitchboard.Switchboard{FungibleToken.Receiver}>(
                FungibleTokenSwitchboard.ReceiverPublicPath,
                target: FungibleTokenSwitchboard.StoragePath
            )
            
            acct.link<&FungibleTokenSwitchboard.Switchboard{FungibleTokenSwitchboard.SwitchboardPublic}>(
                FungibleTokenSwitchboard.PublicPath,
                target: FungibleTokenSwitchboard.StoragePath
            )
        }
    }
}