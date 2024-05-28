import FlowManager from 0x01

transaction(name:String, address: Address) {
    prepare(manager: AuthAccount){
        let contractManager = manager
                    .getCapability(FlowManager.contractManagerPath)!
                    .borrow<&FlowManager.Mapper>()!

        contractManager.setAddress(name, address: address)
    }
}
