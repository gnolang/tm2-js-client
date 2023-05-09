/**
 * Signer is the base signer API.
 * The signer manages data signing
 */
export interface Signer {
  /**
   * Returns the address associated with the signer's public key
   */
  getAddress(): Promise<string>;

  /**
   * Returns the signer's Secp256k1-compressed public key
   */
  getPublicKey(): Promise<Uint8Array>;

  /**
   * Returns the signer's actual raw private key
   */
  getPrivateKey(): Promise<Uint8Array>;

  /**
   * Generates a data signature for arbitrary input
   * @param {Uint8Array} data the data to be signed
   */
  signData(data: Uint8Array): Promise<Uint8Array>;

  /**
   * Verifies if the signature matches the provided raw data
   * @param {Uint8Array} data the raw data (not-hashed)
   * @param {Uint8Array} signature the hashed-data signature
   */
  verifySignature(data: Uint8Array, signature: Uint8Array): Promise<boolean>;
}
