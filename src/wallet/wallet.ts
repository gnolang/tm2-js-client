import { Provider, Status, uint8ArrayToBase64 } from '../provider';
import { Signer } from './signer';
import { LedgerSigner } from './ledger';
import { KeySigner } from './key';
import { Secp256k1 } from '@cosmjs/crypto';
import { generateEntropy, generateKeyPair, stringToUTF8 } from './utility';
import { LedgerConnector } from '@cosmjs/ledger-amino';
import { entropyToMnemonic } from '@cosmjs/crypto/build/bip39';
import { Tx, TxMessage, TxSignature } from '../proto';
import { Secp256k1PubKeyType, TxSignPayload } from './types';
import { sortedJsonStringify } from '@cosmjs/amino/build/signdoc';

/**
 * Wallet is a single account abstraction
 * that can interact with the blockchain
 */
export class Wallet {
  private provider: Provider;
  private signer: Signer;

  /**
   * Connects the wallet to the specified {@link Provider}
   * @param {Provider} provider the active provider
   */
  connect = (provider: Provider) => {
    this.provider = provider;
  };

  // Wallet initialization //

  /**
   * Generates a private key-based wallet, using a random seed
   * @returns {Wallet} the initialized {@link Wallet}
   */
  static createRandom = async (): Promise<Wallet> => {
    const { publicKey, privateKey } = await generateKeyPair(
      entropyToMnemonic(generateEntropy()),
      0
    );

    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey)
    );

    return wallet;
  };

  /**
   * Generates a bip39 mnemonic-based wallet
   * @param {string} mnemonic the bip39 mnemonic
   * @param {number} [accountIndex=0] the account index
   * @returns {Wallet} the initialized {@link Wallet}
   */
  static fromMnemonic = async (
    mnemonic: string,
    accountIndex?: number
  ): Promise<Wallet> => {
    const { publicKey, privateKey } = await generateKeyPair(
      mnemonic,
      accountIndex
    );

    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey)
    );

    return wallet;
  };

  /**
   * Generates a private key-based wallet
   * @param {string} privateKey the private key
   * @returns {Wallet} the initialized {@link Wallet}
   */
  static fromPrivateKey = async (privateKey: Uint8Array): Promise<Wallet> => {
    // Derive the public key
    const { pubkey: publicKey } = await Secp256k1.makeKeypair(privateKey);

    // Initialize the wallet
    const wallet: Wallet = new Wallet();
    wallet.signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey)
    );

    return wallet;
  };

  /**
   * Creates a Ledger-based wallet
   * @param {LedgerConnector} connector the Ledger device connector
   * @param {number} [accountIndex=0] the account index
   * @returns {Wallet} the initialized {@link Wallet}
   */
  static fromLedger = (
    connector: LedgerConnector,
    accountIndex?: number
  ): Wallet => {
    const wallet: Wallet = new Wallet();

    wallet.signer = new LedgerSigner(
      connector,
      accountIndex ? accountIndex : 0
    );

    return wallet;
  };

  // Account manipulation //

  /**
   * Fetches the address associated with the wallet
   * @returns {string} the account address
   */
  getAddress = (): Promise<string> => {
    return this.signer.getAddress();
  };

  /**
   * Fetches the account sequence for the wallet
   * @param {number} [height=latest] the block height
   * @returns {number} the account sequence
   */
  getSequence = async (height?: number): Promise<number> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Get the address
    const address: string = await this.getAddress();

    return this.provider.getSequence(address, height);
  };

  /**
   * Fetches the account number for the wallet. Errors out if the
   * account is not initialized
   * @param {number} [height=latest] the block height
   * @returns {number} the account sequence
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
   * @returns {number} the account balance, if any
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
   * @returns {Provider} The connected provider, if any
   */
  getProvider = (): Provider => {
    return this.provider;
  };

  /**
   * Generates a transaction signature, and appends it to the transaction
   * @param {Tx} tx the transaction to be signed
   * @returns {Tx} the signed transaction
   */
  signTransaction = async (tx: Tx): Promise<Tx> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Make sure the tx fee is initialized
    if (!tx.fee) {
      throw new Error('invalid transaction fee provided');
    }

    // Extract the relevant chain data
    const status: Status = await this.provider.getStatus();
    const chainID: string = status.node_info.network;

    // Extract the relevant account data
    const address: string = await this.getAddress();
    const accountNumber: number = await this.provider.getAccountNumber(address);
    const accountSequence: number = await this.provider.getSequence(address);
    const publicKey: Uint8Array = await this.signer.getPublicKey();

    // Create the signature payload
    const signPayload: TxSignPayload = {
      chain_id: chainID,
      account_number: accountNumber.toString(10),
      sequence: accountSequence.toString(10),
      fee: {
        gas_fee: tx.fee.gasFee,
        gas_wanted: tx.fee.gasWanted.toString(10),
      },
      msgs: tx.messages.map((m: TxMessage) => ({
        '@type': m.typeUrl,
        ...m.value,
      })),
      memo: tx.memo,
      time: new Date().toISOString(),
    };

    // The TM2 node does signature verification using
    // a sorted JSON object, so the payload needs to be sorted
    // before signing
    const signBytes: Uint8Array = stringToUTF8(
      sortedJsonStringify(signPayload)
    );

    // Generate the signature
    const txSignature: TxSignature = {
      pubKey: {
        type: Secp256k1PubKeyType,
        value: publicKey,
      },
      signature: await this.signer.signData(signBytes),
    };

    // Append the signature
    return {
      ...tx,
      signatures: [...tx.signatures, txSignature],
    };
  };

  /**
   * Signs and sends the transaction. Returns the transaction hash (base-64)
   * @param {Tx} tx the unsigned transaction
   */
  sendTransaction = async (tx: Tx): Promise<string> => {
    if (!this.provider) {
      throw new Error('provider not connected');
    }

    // Sign the transaction
    const signedTx: Tx = await this.signTransaction(tx);

    // Encode the transaction to base-64
    const encodedTx: string = uint8ArrayToBase64(Tx.encode(signedTx).finish());

    // Send the encoded transaction
    return this.provider.sendTransaction(encodedTx);
  };

  /**
   * Returns the associated signer
   */
  getSigner = (): Signer => {
    return this.signer;
  };
}
