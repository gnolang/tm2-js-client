import { generateEntropy, generateKeyPair } from '../utility/utility';
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
});
