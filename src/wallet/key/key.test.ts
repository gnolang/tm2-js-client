import { generateEntropy, generateKeyPair, stringToUTF8 } from '../utility';
import { entropyToMnemonic } from '@cosmjs/crypto/build/bip39';
import { KeySigner } from './key';

describe('Private Key Signer', () => {
  const generateRandomKeySigner = async (
    index?: number
  ): Promise<KeySigner> => {
    const { publicKey, privateKey } = await generateKeyPair(
      entropyToMnemonic(generateEntropy()),
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
