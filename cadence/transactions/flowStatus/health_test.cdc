transaction(a: Int, b: Int) {
    prepare(signer: AuthAccount) {
        let c = a + b
        log(c)
    }
}
