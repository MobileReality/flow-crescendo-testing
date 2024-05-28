import {
    getAccountAddress,
    shallResolve,
    shallRevert,
    shallPass, describeParallel,
} from '../src/test-utils';
import {
    deployExampleNFT,
    getExampleNFTCollectionLength,
    getExampleNFTSupply,
    mintRandomExampleNFT, setupExampleNFTOnAccount, transferExampleNFT
} from "../src/example-nft";

// noinspection UnnecessaryLocalVariableJS
const describe = describeParallel;
describe('ExampleNFT', () => {

    let User1, User2;

    it('should deploy exampleNFT contract', async () => {
        await shallPass(deployExampleNFT());
        expect(await getExampleNFTSupply()).toBe(0);
    });

    it('should mint exampleNFT', async () => {
        User1 = await getAccountAddress('User1');
        await shallPass(setupExampleNFTOnAccount(User1));
        await shallPass(mintRandomExampleNFT(User1));
        expect(await getExampleNFTSupply()).toBe(1);
        expect(await getExampleNFTCollectionLength(User1)).toBe(1);
    });

    it('should fail transfer exampleNFT - no setup', async () => {
        User2 = await getAccountAddress('User2');
        await shallRevert(transferExampleNFT(User1, User2, 0));

    })
    it('should transfer exampleNFT', async () => {
        await shallPass(setupExampleNFTOnAccount(User2));
        await shallPass(transferExampleNFT(User1, User2, 0));
        expect(await getExampleNFTCollectionLength(User1)).toBe(0);
        expect(await getExampleNFTCollectionLength(User2)).toBe(1);
    })

});
