transaction(index: Int) {

	prepare(signer: AuthAccount) {
		signer.keys.revoke(keyIndex: index)
	}
}