import { Provider } from '../provider/provider';
import { Signer } from './signer';
import { LedgerSigner } from './ledger/ledger';
import { KeySigner } from './key/key';
import { Secp256k1 } from '@cosmjs/crypto';
import { generateEntropy, generateKeyPair } from './utility/utility';
import { LedgerConnector } from '@cosmjs/ledger-amino';
import { entropyToMnemonic } from '@cosmjs/crypto/build/bip39';

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
    accountIndex?: number // TODO add configurable path, using stringToPath?
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
    accountIndex?: number // TODO add configurable path, using stringToPath?
  ): Wallet => {
    const wallet: Wallet = new Wallet();

    wallet.signer = new LedgerSigner(
      connector,
      accountIndex ? accountIndex : 0
    );

    return wallet;
  };

  // Account info //

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

    return this.provider.getBalance(address, denomination);
  };

  // Provider //

  /**
   * Returns the connected provider, if any
   * @returns {Provider} The connected provider, if any
   */
  getProvider = (): Provider => {
    return this.provider;
  };
}
