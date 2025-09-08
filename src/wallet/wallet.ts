import {
  BroadcastTransactionMap,
  Provider,
  Status,
  uint8ArrayToBase64,
} from '../provider';
import { Signer } from './signer';
import { LedgerSigner } from './ledger';
import { KeySigner } from './key';
import { Secp256k1 } from '@cosmjs/crypto';
import {
  encodeCharacterSet,
  generateEntropy,
  generateKeyPair,
  stringToUTF8,
} from './utility';
import { LedgerConnector } from '@cosmjs/ledger-amino';
import { entropyToMnemonic } from '@cosmjs/crypto/build/bip39';
import { Any, PubKeySecp256k1, Tx, TxSignature } from '../proto';
import {
  AccountWalletOption,
  CreateWalletOptions,
  Secp256k1PubKeyType,
  TxSignPayload,
} from './types';
import { sortedJsonStringify } from '@cosmjs/amino/build/signdoc';

export interface SignTransactionOptions {
  chainId?: string;
  accountNumber?: string;
  sequence?: string;
}

/**
 * Wallet is a single account abstraction
 * that can interact with the blockchain
 */
export class Wallet {
  protected provider: Provider;
  protected signer: Signer;

  /**
   * Connects the wallet to the specified {@link Provider}
   * @param {Provider} provider the active {@link Provider}, if any
   */
  connect = (provider: Provider) => {
    this.provider = provider;
  };

  // Wallet initialization //

  /**
   * Generates a private key-based wallet, using a random seed
   * @param {AccountWalletOption} options the account options
   */
  static createRandom = async (
    options?: AccountWalletOption
  ): Promise<Wallet> => {
    const { publicKey, privateKey } = await generateKeyPair(
      entropyToMnemonic(generateEntropy()),
      0
    );

    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey),
      options?.addressPrefix
    );

    return wallet;
  };

  /**
   * Generates a custom signer-based wallet
   * @param {Signer} signer the custom signer implementing the Signer interface
   * @param {CreateWalletOptions} options the wallet generation options
   */
  static fromSigner = async (signer: Signer): Promise<Wallet> => {
    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = signer;

    return wallet;
  };

  /**
   * Generates a bip39 mnemonic-based wallet
   * @param {string} mnemonic the bip39 mnemonic
   * @param {CreateWalletOptions} options the wallet generation options
   */
  static fromMnemonic = async (
    mnemonic: string,
    options?: CreateWalletOptions
  ): Promise<Wallet> => {
    const { publicKey, privateKey } = await generateKeyPair(
      mnemonic,
      options?.accountIndex
    );

    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey),
      options?.addressPrefix
    );

    return wallet;
  };

  /**
   * Generates a private key-based wallet
   * @param {string} privateKey the private key
   * @param {AccountWalletOption} options the account options
   */
  static fromPrivateKey = async (
    privateKey: Uint8Array,
    options?: AccountWalletOption
  ): Promise<Wallet> => {
    // Derive the public key
    const { pubkey: publicKey } = await Secp256k1.makeKeypair(privateKey);

    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey),
      options?.addressPrefix
    );

    return wallet;
  };

  /**
   * Creates a Ledger-based wallet
   * @param {LedgerConnector} connector the Ledger device connector
   * @param {CreateWalletOptions} options the wallet generation options
   */
  static fromLedger = (
    connector: LedgerConnector,
    options?: CreateWalletOptions
  ): Wallet => {
    const wallet: Wallet = new Wallet();

    wallet.signer = new LedgerSigner(
      connector,
      options?.accountIndex ?? 0,
      options?.addressPrefix
    );

    return wallet;
  };

  // Account manipulation //

  /**
   * Fetches the address associated with the wallet
   */
  getAddress = (): Promise<string> => {
    return this.signer.getAddress();
  };

  /**
   * Fetches the account sequence for the wallet
   * @param {number} [height=latest] the block height
   */
  getAccountSequence = async (height?: number): Promise<number> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Get the address
    const address: string = await this.getAddress();

    return this.provider.getAccountSequence(address, height);
  };

  /**
   * Fetches the account number for the wallet. Errors out if the
   * account is not initialized
   * @param {number} [height=latest] the block height
   */
  getAccountNumber = async (height?: number): Promise<number> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Get the address
    const address: string = await this.getAddress();

    return this.provider.getAccountNumber(address, height);
  };

  /**
   * Fetches the account balance for the specific denomination
   * @param {string} [denomination=ugnot] the fund denomination
   */
  getBalance = async (denomination?: string): Promise<number> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Get the address
    const address: string = await this.getAddress();

    return this.provider.getBalance(
      address,
      denomination ? denomination : 'ugnot'
    );
  };

  /**
   * Fetches the current (recommended) average gas price
   */
  getGasPrice = async (): Promise<number> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    return this.provider.getGasPrice();
  };

  /**
   * Estimates the gas limit for the transaction
   * @param {Tx} tx the transaction that needs estimating
   */
  estimateGas = async (tx: Tx): Promise<number> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    return this.provider.estimateGas(tx);
  };

  /**
   * Returns the connected provider, if any
   */
  getProvider = (): Provider => {
    return this.provider;
  };

  /**
   * Generates a transaction signature, and appends it to the transaction
   * @param {Tx} tx the transaction to be signed
   * @param {(messages: Any[]) => any[]} decodeTxMessages tx message decode callback
   * that should expand the concrete message fields into an object. Required because
   * the transaction sign bytes are generated using sorted JSON, which requires
   * encoded message values to be decoded for sorting
   */
  signTransaction = async (
    tx: Tx,
    decodeTxMessages: (messages: Any[]) => any[],
    opts?: SignTransactionOptions
  ): Promise<Tx> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Make sure the tx fee is initialized
    if (!tx.fee) {
      throw new Error('invalid transaction fee provided');
    }

    // Extract the relevant chain data
    let chainID = opts?.chainId;
    if (chainID === undefined) {
      const status: Status = await this.provider.getStatus();
      chainID = status.node_info.network;
    }

    // Extract the relevant account data
    let accountNumber = opts?.accountNumber;
    let accountSequence = opts?.sequence;
    if (accountNumber === undefined || accountSequence === undefined) {
      const address: string = await this.getAddress();
      const account = await this.provider.getAccount(address);
      if (accountNumber === undefined) {
        accountNumber = account.BaseAccount.account_number;
      }
      if (accountSequence === undefined) {
        accountSequence = account.BaseAccount.sequence;
      }
    }
    const publicKey: Uint8Array = await this.signer.getPublicKey();

    // Create the signature payload
    const signPayload: TxSignPayload = {
      chain_id: chainID,
      account_number: accountNumber,
      sequence: accountSequence,
      fee: {
        gas_fee: tx.fee.gas_fee,
        gas_wanted: tx.fee.gas_wanted.toString(10),
      },
      msgs: decodeTxMessages(tx.messages), // unrolled message objects
      memo: tx.memo,
    };

    // The TM2 node does signature verification using
    // a sorted JSON object, so the payload needs to be sorted
    // before signing
    const signBytes: Uint8Array = stringToUTF8(
      encodeCharacterSet(sortedJsonStringify(signPayload))
    );

    // The public key needs to be encoded using protobuf for Amino
    const wrappedKey: PubKeySecp256k1 = {
      key: publicKey,
    };

    // Generate the signature
    const txSignature: TxSignature = {
      pub_key: {
        type_url: Secp256k1PubKeyType,
        value: PubKeySecp256k1.encode(wrappedKey).finish(),
      },
      signature: await this.getSigner().signData(signBytes),
    };

    // Append the signature
    return {
      ...tx,
      signatures: [...tx.signatures, txSignature],
    };
  };

  /**
   * Encodes and sends the transaction. If the type of endpoint
   * is a broadcast commit, waits for the transaction to be committed to the chain.
   * The transaction needs to be signed beforehand.
   * Returns the transaction hash (base-64)
   * @param {Tx} tx the signed transaction
   * @param {BroadcastType} endpoint the transaction broadcast type (sync / commit)
   */
  async sendTransaction<K extends keyof BroadcastTransactionMap>(
    tx: Tx,
    endpoint: K
  ): Promise<BroadcastTransactionMap[K]['result']> {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Encode the transaction to base-64
    const encodedTx: string = uint8ArrayToBase64(Tx.encode(tx).finish());

    // Send the encoded transaction
    return this.provider.sendTransaction(encodedTx, endpoint);
  }

  /**
   * Returns the associated signer
   */
  getSigner = (): Signer => {
    return this.signer;
  };
}
