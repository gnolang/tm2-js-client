import { Tx } from '../proto/tm2/tx';

/**
 * Signer is the base signer API.
 * The signer manages data signing
 */
export interface Signer {
  /**
   * Returns the address associated with the signer's public key
   * @returns {string} the public key address
   */
  getAddress(): Promise<string>;

  /**
   * Returns the signer's Secp256k1-compressed public key
   * @returns {Uint8Array}
   */
  getPublicKey(): Promise<Uint8Array>;

  /**
   * Generates a transaction signature, and appends it to the transaction
   * @param {Tx} tx the transaction to be signed
   * @returns {Tx} the signed transaction
   */
  signTransaction(tx: any): any; // TODO define type

  /**
   * Generates a data signature for arbitrary input
   * @param {Uint8Array} data the data to be signed
   * @returns {Uint8Array} the signature of the data
   */
  signData(data: Uint8Array): Promise<Uint8Array>;

  /**
   * Verifies if the signature matches the provided raw data
   * @param {Uint8Array} data the raw data (not-hashed)
   * @param {Uint8Array} signature the hashed-data signature
   * @returns {Promise<boolean>
   */
  verifySignature(data: Uint8Array, signature: Uint8Array): Promise<boolean>;
}
