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
  getAddress(): string;

  /**
   * Returns the signer's public key
   * @returns {any}
   */
  getPublicKey(): any;

  /**
   * Generates a transaction signature, and appends it to the transaction
   * @param {Tx} tx the transaction to be signed
   * @returns {Tx} the signed transaction
   */
  signTransaction(tx: any): any; // TODO define type

  /**
   * Generates a data signature for arbitrary input
   * @param data the data to be signed
   * @returns {any} the signature of the data
   */
  signData(data: any): any;
}
