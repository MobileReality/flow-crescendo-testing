import {
    Address,
    UInt64,
    UFix64,
    String,
    Optional,
    Dictionary,
    Array,
} from '@onflow/types';
import {
    deployContract,
    deployContractByName,
    executeScript,
    getContractAddress,
    getContractCode,
    getScriptCode,
    getTransactionCode,
    mintFlow,
    sendTransaction, shallPass,
} from '@onflow/flow-js-testing';
import {
    getExampleAddress,
    toUFix64,
} from './common';
import * as faker from 'faker';
import {
    accSetuper,
    cleanDictUndefined, setContractAddress,
    willPass,
    willResolve,
} from './test-utils';
import { isArray } from 'lodash';

/*
 * Deploys NonFungibleToken and ExampleNFT contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployExampleNFT = async () => {
    const ExampleNFT = await getExampleAddress();

    const contractName = 'ExampleNFT2';

    await mintFlow(ExampleNFT, '10.0');
    await setContractAddress(contractName, ExampleNFT);
    return deployContractByName({
        to: ExampleNFT,
        name: contractName,
    });
};

/*
 * Creates new NFTMinter for **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const createNFTMinter = async (admin, newAdmin) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/create_nft_minter';
    const addressMap = { ExampleNFT };
    const code = await getTransactionCode({ name, addressMap });

    const signers = [admin, newAdmin];
    const args = [];

    return sendTransaction({ code, signers, args });
};

/*
 * Transfers NFTMinter from **admin** account to **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferNFTMinter = async (admin, newAdmin) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/transfer_nft_minter';
    const addressMap = { ExampleNFT };
    const code = await getTransactionCode({ name, addressMap });

    const signers = [admin, newAdmin];
    const args = [];

    return sendTransaction({ code, signers, args });
};

/*
 * Setups royalty receiver on account.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupRoyaltyReceiverOnAccount = accSetuper(
    'royalty',
    async (account) =>
        sendTransaction({
            name: 'exampleNFT/setup_royalty_receiver',
            signers: [account],
        }),
);

/*
 * Setups ExampleNFT collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupExampleNFTOnAccount = accSetuper('ExampleNFT', async (account) =>
    sendTransaction({
        name: 'exampleNFT/setup_account',
        signers: [account],
        addressMap: { ExampleNFT: await getExampleAddress() },
    }),
);

/*
 * Setups legacy ExampleNFT collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupLegacyExampleNFTOnAccount = accSetuper(
    'ExampleNFT_legacy',
    (account) =>
        sendTransaction({
            name: 'exampleNFT/setup_account_legacy',
            signers: [account],
        }),
);

/*
 * borrows reference to ExampleNFT collection on account.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const borrowCollectionReference = async (account) => {
    const name = 'exampleNFT/borrow_public_capability';
    const code = await getTransactionCode({ name });
    const args = [[account, Address]];
    const signers = [account];

    return sendTransaction({ code, args, signers });
};

/**
 * Returns ExampleNFT supply.
 * @throws Will throw an error if execution fails
 * @returns {Promise<number>} - number of NFT minted so far
 * */
export const getExampleNFTSupply = async () =>
    willResolve(
        executeScript({ name: 'exampleNFT/read_example_nfts_supply' }),
    ).then(Number);

/*
 * Returns random nft item id
 * */
export const getRandomItemId = () => faker.datatype.uuid();

/*
 * Returns random metadata
 * */
export const getRandomMetadata = (metadata = {}) => {
    return {
        name: metadata.name || faker.random.words(4),
        description: metadata.description || faker.random.words(20),
        thumbnail: metadata.thumbnail || faker.image.imageUrl(),
    };
};

/*
 * Mints ExampleNFT and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {string} itemId - nft itemId
 * @param {number} quantity - nfts quantity
 * @param {object} metadata - nft metadata
 * @param {array}  royalties - list of royalties recipients with royalty percentages
 * @param {object} additionalInfo - additional information for nft
 * @param {string} minter - minter address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintExampleNFT = async (
    recipient,
    //quantity,
    metadata,
    royalties = [],
    additionalInfo = {},
    minter = null,
) => {
    const ExampleNFT = await getExampleAddress();
    const ExampleNFTAdmin = minter || ExampleNFT;

    const name = 'exampleNFT/mint_nft';
    const addressMap = {  ExampleNFT };
    const code = await getTransactionCode({ name, addressMap });

    const signers = [ExampleNFTAdmin];
    const args = [
        [recipient, Address],
        [metadata.name, String],
        [metadata.description, String],
        [metadata.thumbnail, String],
        [
            royalties.map((royalty) => {
                return { key: royalty.receiver, value: toUFix64(royalty.percentage) };
            }),
            Dictionary({ key: Address, value: UFix64 }),
        ],
        [
            Object.keys(additionalInfo).map(function (key) {
                return { key, value: additionalInfo[key] };
            }),
            Dictionary({ key: String, value: String }),
        ],
        //[`${quantity}`, UInt64],
    ];

    return sendTransaction({ code, signers, args });
};

/*
 * Mints random ExampleNFT and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {number} quantity - nfts quantity
 * @param {object} data - nft data
 * @param {string} minter - minter address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintRandomExampleNFT = async (
    recipient,
    //quantity = 1,
    data = {},
    minter = null,
) => {
    await setupExampleNFTOnAccount(recipient);

    //const itemId = data.itemId || getRandomItemId();
    const royalties = data.royalties || [];
    const metadata = getRandomMetadata();

    return mintExampleNFT(
        recipient,
        //itemId,
        //quantity,
        metadata,
        royalties,
        {},
        minter,
    );
};

/**
 * Transfers ExampleNFT NFT with id equal **collectibleId** from **sender** account to **recipient**.
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {number} collectibleId - id of the item to transfer
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferExampleNFT = async (sender, recipient, collectibleId) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/transfer_nft';
    const addressMap = { ExampleNFT };
    const code = await getTransactionCode({ name, addressMap });

    const signers = [sender];
    const args = [
        [recipient, Address],
        [`${collectibleId}`, UInt64],
    ];

    return sendTransaction({ code, signers, args });
};

/*
 * Destroys ExampleNFT NFT with id equal **collectibleId** from **sender** account.
 * @param {string} owner - sender address
 * @param {UInt64} collectibleId - id of the item to transfer
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const destroyExampleNFT = async (owner, collectibleId) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/destroy_collectible';
    const addressMap = { ExampleNFT };
    const code = await getTransactionCode({ name, addressMap });

    const signers = [owner];
    const args = [[`${collectibleId}`, UInt64]];

    return sendTransaction({ code, signers, args });
};

/*
 * Burns ExampleNFT NFTs.
 * @param {string} owner - sender address
 * @param {UInt64} nftIds - ids of nfts to burn
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const burnExampleNFTs = async (owner, nftIds) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/burn_nfts';
    const addressMap = { ExampleNFT };
    const code = await getTransactionCode({ name, addressMap });

    const signers = [owner];
    const args = [[nftIds.map((id) => `${id}`), Array(UInt64)]];

    return sendTransaction({ code, signers, args });
};

/**
 * @typedef {object} ExampleNFT
 * @property {string} itemId
 * @property {string} edition
 */

/**
 * Returns ExampleNFT with **id** in account collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<ExampleNFT>}
 * */
export const getExampleNFTById = async (account, id) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/read_example_nft';
    const addressMap = { ExampleNFT };
    const code = await getScriptCode({ name, addressMap });

    const args = [
        [account, Address],
        [`${id}`, UInt64],
    ];

    return willResolve(executeScript({ code, args }));
};

/**
 * Returns ExampleNFT MetadataViews.
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const getExampleNFTViewsById = async (account, id) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/read_example_nft_views';
    const addressMap = { ExampleNFT };
    const code = await getScriptCode({ name, addressMap });

    const args = [
        [account, Address],
        [`${id}`, UInt64],
    ];

    return willResolve(executeScript({ code, args }));
};

/**
 * Returns ExampleNFT additionalInfo.
 * @throws Will throw an error if execution fails
 * */
export const getExampleNFTAdditionalInfoById = async (account, id) => {
    const args = [
        [account, Address],
        [`${id}`, UInt64],
    ];

    return willResolve(
        executeScript({ name: 'exampleNFT/read_example_nft_additional_info', args }),
    );
};

/**
 * Returns the length of account's ExampleNFT collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<number>}
 * */
export const getExampleNFTCollectionLength = async (account) =>
    willResolve(
        executeScript(isArray(account)?{
            name: 'exampleNFT/read_collection_lengths',
            args: [[account, Array(Address)]],
        }:{
            name: 'exampleNFT/read_collection_length',
            args: [[account, Address]],
        }),
    ).then(isArray(account)?(res)=>res.map(Number):Number);

/**
 * Returns total number of minted nft editions
 * @throws Will throw an error if execution fails
 * @returns {Promise<UInt64>}
 * */
export const getTotalEditionsCount = async (account, id = 0) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/read_total_editions_count';
    const addressMap = { ExampleNFT };

    const code = await getScriptCode({ name, addressMap });
    const args = [
        [account, Address],
        [`${id}`, UInt64],
    ];

    return willResolve(executeScript({ code, args })).then(Number);
};

/*
 * Returns circulating number of minted nft editions
 * @throws Will throw an error if execution fails
 * @returns {Promise<UInt64>}
 * */
export const getCirculatingEditionsCount = async (account, id = 0) => {
    const ExampleNFT = await getExampleAddress();

    const name = 'exampleNFT/read_circulating_editions_count';
    const addressMap = { ExampleNFT };

    const code = await getScriptCode({ name, addressMap });
    const args = [
        [account, Address],
        [`${id}`, UInt64],
    ];

    return willResolve(executeScript({ code, args })).then(Number);
};

const mintedEventTypes = ['Minted', 'CollectibleMinted', 'Mint'];
/**
 * Returns minted collectibles from transaction result
 * @param {FclTxResult} transactionResult
 * @returns {{eventType: string, collectibleId: number}[]}
 * */
export const getMintedCollectiblesFromTransactionResult = (
    transactionResult,
) => {
    return transactionResult.events
        .filter((event) => {
            for (const type of mintedEventTypes) {
                if (event.type.endsWith(type)) return true;
            }
            return false;
        })
        .map((event) =>
            cleanDictUndefined({
                eventType: event.type,
                collectibleId: Number(event.data.id),
                uuid: event.data.uuid ? Number(event.data.uuid) : undefined,
                edition: event.data.edition ? Number(event.data.edition) : undefined,
            }),
        ).sort(e=>e.edition);
};
/**
 * Returns minted collectible ids from transaction result
 * @param {FclTxResult} transactionResult
 * @returns {UInt64[]}
 * */
export const getMintedCollectibleIdsFromTransactionResult = (
    transactionResult,
) => {
    return getMintedCollectiblesFromTransactionResult(transactionResult).map(
        ({ collectibleId }) => collectibleId,
    );
};
