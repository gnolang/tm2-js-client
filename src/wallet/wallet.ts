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
  public connect = (provider: Provider) => {
    this.provider = provider;
  };

  /**
   * Generates a private key-based wallet, using a random seed
   * @returns {Wallet} the initialized {@link Wallet}
   */
  public static createRandom = async (): Promise<Wallet> => {
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
  public static fromMnemonic = async (
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
  public static fromPrivateKey = async (
    privateKey: Uint8Array
  ): Promise<Wallet> => {
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
  public static fromLedger = (
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
}
