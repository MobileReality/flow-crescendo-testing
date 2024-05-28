import * as stable from 'testing-stable/src/example-nft';
import * as legacy from 'testing-legacy/src/example-nft';
import * as sdkLeg from 'sdk-legacy';
import {shallResolve, shallPass, shallRevert, shallThrow} from 'testing-stable/src/test-utils';
import {getAccountAddress, trySkipSuite} from '../src/util'


describe('Tunego ExampleNFT Test', () => {
  it('MUST deploy ExampleNFT contract',  () => trySkipSuite(async () => {
    await shallPass(legacy.deployExampleNFT());
    const count = await legacy.getExampleNFTSupply();
    expect(count).toBe(0);
  }));

  let User1, User2, User3, len;

  it('MUST setup accounts',  () => trySkipSuite(async () => {
    User1 = await getAccountAddress('User1');
    User2 = await getAccountAddress('User2');
    User3 = await getAccountAddress('User3');
    await shallPass(legacy.setupExampleNFTOnAccount(User1));
    await shallPass(legacy.setupExampleNFTOnAccount(User2));
    await shallPass(legacy.setupExampleNFTOnAccount(User3));
    len = await legacy.getExampleNFTCollectionLength(User1);
    expect(len).toBe(0);
  }));

  it('MUST mint ExampleNFT', async ()=>{
    for(let i=0; i<7; i++)
      await shallPass(legacy.mintRandomExampleNFT(User1));

    const mintedCount = await legacy.getExampleNFTSupply();
    expect(mintedCount).toBe(7);
    len = await legacy.getExampleNFTCollectionLength(User1);
    expect(len).toBe(7);

    // const views = await shallResolve(legacy.getExampleNFTViews(User1, 3));
    //
    // expect(views.metadata['Asset']).toEndWith('.mp4');
    // expect(views.display.thumbnail.url).toEndWith('.gif');
    // expect(views.display.thumbnail.url).toStrictEqual(
    //   views.metadata['Asset'].replace('.mp4', '.gif'),
    // );

  });

  it('MUST transfer ExampleNFT', async ()=>{
    await shallPass(legacy.transferExampleNFT(User1, User2, 3));

    len = await legacy.getExampleNFTCollectionLength(User1);
    expect(len).toBe(6);
    len = await legacy.getExampleNFTCollectionLength(User2);
    expect(len).toBe(1);
  });

  describe.performMigration();

  it('MUST execute script on migrated contract', async()=>{
    len = await stable.getExampleNFTSupply();
    expect(len).toBe(7);

    len = await stable.getExampleNFTCollectionLength(User1, true);
    expect(len).toBe(6);
    len = await stable.getExampleNFTCollectionLength(User2, true);
    expect(len).toBe(1);
  });

  it('should fail non-direct read without re-setup', async()=>{
    await expect(stable.getExampleNFTCollectionLength(User1)).toReject();
  });

  it('should re-setup', async()=>{
    await shallPass(stable.setupExampleNFTOnAccount(User1));
    len = await stable.getExampleNFTCollectionLength(User1);
    expect(len).toBe(6);
  });

  it('should transfer ExampleNFT after migration', async()=>{
    await shallRevert(stable.transferExampleNFT(User1, User3, 3));
    await shallPass(stable.transferExampleNFT(User1, User3, 4));

    len = await stable.getExampleNFTCollectionLength(User1, true);
    expect(len).toBe(5);
    len = await stable.getExampleNFTCollectionLength(User3, true);
    expect(len).toBe(1);
  });

  it('should mint additional collectibles', async()=>{
    await shallPass(stable.mintRandomExampleNFT(User3));

    len = await stable.getExampleNFTSupply();
    expect(len).toBe(8);
  });
});
