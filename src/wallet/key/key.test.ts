import { describe, expect, test } from 'vitest';
import { Bip39 } from '@cosmjs/crypto';
import { generateEntropy, generateKeyPair, stringToUTF8 } from '../utility/index.js';
import { KeySigner } from './key.js';

describe('Private Key Signer', () => {
  const generateRandomKeySigner = async (
    index?: number
  ): Promise<KeySigner> => {
    const { publicKey, privateKey } = await generateKeyPair(
      Bip39.encode(generateEntropy()).toString(),
      index ? index : 0
    );

    return new KeySigner(privateKey, publicKey);
  };

  test('getAddress', async () => {
    const signer: KeySigner = await generateRandomKeySigner();
    const address: string = await signer.getAddress();

    expect(address.length).toBe(40);
  });

  test('getPublicKey', async () => {
    const signer: KeySigner = await generateRandomKeySigner();
    const publicKey: Uint8Array = await signer.getPublicKey();

    expect(publicKey).not.toBeNull();
    expect(publicKey).toHaveLength(65);
  });

  test('getPrivateKey', async () => {
    const signer: KeySigner = await generateRandomKeySigner();
    const privateKey: Uint8Array = await signer.getPrivateKey();

    expect(privateKey).not.toBeNull();
    expect(privateKey).toHaveLength(32);
  });

  test('signData', async () => {
    const rawData: Uint8Array = stringToUTF8('random raw data');
    const signer: KeySigner = await generateRandomKeySigner();

    // Sign the data
    const signature: Uint8Array = await signer.signData(rawData);

    // Verify the signature
    const isValid: boolean = await signer.verifySignature(rawData, signature);

    expect(isValid).toBe(true);
  });
});
