transaction(publicKey: String) {
    prepare(admin: auth(BorrowValue) &Account) {
        let newAccount = Account(payer: admin)
        let keyData = RLP.decodeList(publicKey.decodeHex())
        let rawSign = RLP.decodeString(keyData[1])[0]
        let rawHash = RLP.decodeString(keyData[2])[0]
        newAccount.keys.add(
            publicKey:  PublicKey(
              publicKey: RLP.decodeString(keyData[0]),
              signatureAlgorithm: SignatureAlgorithm(rawValue: rawSign)!
            ),
          hashAlgorithm: HashAlgorithm(rawValue: rawHash)!,
          weight: UFix64(Int32.fromBigEndianBytes(RLP.decodeString(keyData[3]))!)!
        )

        let address = newAccount.address
    }
}
