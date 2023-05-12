import {
  Bip39,
  EnglishMnemonic,
  HdPath,
  Secp256k1,
  Slip10,
  Slip10Curve,
  Slip10RawIndex,
} from '@cosmjs/crypto';
import crypto from 'crypto';

/**
 * Generates the HD path, for the specified index, in the form 'm/44'/118'/0'/0/i',
 * where 'i' is the account index
 * @param {number} [index=0] the account index
 */
export const generateHDPath = (index?: number): HdPath => {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(118),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(index ? index : 0),
  ];
};

/**
 * Generates random entropy of the specified size (in B)
 * @param {number} [size=32] the entropy size in bytes
 */
export const generateEntropy = (size?: number): Uint8Array => {
  const array = new Uint8Array(size ? size : 32);

  // Generate random data
  crypto.randomFillSync(array);

  return array;
};

interface keyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

/**
 * Generates a new Secp256k1 key-pair using
 * the provided English mnemonic and account index
 * @param {string} mnemonic the English mnemonic
 * @param {number} [accountIndex=0] the account index
 */
export const generateKeyPair = async (
  mnemonic: string,
  accountIndex?: number
): Promise<keyPair> => {
  // Generate the seed
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));

  // Derive the private key
  const { privkey: privateKey } = Slip10.derivePath(
    Slip10Curve.Secp256k1,
    seed,
    generateHDPath(accountIndex)
  );

  // Derive the public key
  const { pubkey: publicKey } = await Secp256k1.makeKeypair(privateKey);

  return {
    publicKey: publicKey,
    privateKey: privateKey,
  };
};

// Address prefix for TM2 networks
export const defaultAddressPrefix = 'g';

/**
 * Encodes a string into a Uint8Array
 * @param {string} str the string to be encoded
 */
export const stringToUTF8 = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};
