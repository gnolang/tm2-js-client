import { Signer } from '../signer';
import { encodeSecp256k1Pubkey, pubkeyToAddress } from '@cosmjs/amino';
import { Secp256k1, Secp256k1Signature, sha256 } from '@cosmjs/crypto';
import { defaultAddressPrefix } from '../utility';

/**
 * KeySigner implements the logic for the private key signer
 */
export class KeySigner implements Signer {
  private readonly privateKey: Uint8Array; // the raw private key
  private readonly publicKey: Uint8Array; // the compressed public key
  private readonly addressPrefix: string; // the address prefix

  /**
   * Creates a new {@link KeySigner} instance
   * @param {Uint8Array} privateKey the raw Secp256k1 private key
   * @param {Uint8Array} publicKey the raw Secp256k1 public key
   * @param {string} addressPrefix the address prefix
   */
  constructor(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    addressPrefix: string = defaultAddressPrefix
  ) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.addressPrefix = addressPrefix;
  }

  getAddress = async (): Promise<string> => {
    return pubkeyToAddress(
      encodeSecp256k1Pubkey(Secp256k1.compressPubkey(this.publicKey)),
      this.addressPrefix
    );
  };

  getPublicKey = async (): Promise<Uint8Array> => {
    return this.publicKey;
  };

  getPrivateKey = async (): Promise<Uint8Array> => {
    return this.privateKey;
  };

  signData = async (data: Uint8Array): Promise<Uint8Array> => {
    const signature = await Secp256k1.createSignature(
      sha256(data),
      this.privateKey
    );

    return new Uint8Array([
      ...(signature.r(32) as any),
      ...(signature.s(32) as any),
    ]);
  };

  verifySignature = async (
    data: Uint8Array,
    signature: Uint8Array
  ): Promise<boolean> => {
    return Secp256k1.verifySignature(
      Secp256k1Signature.fromFixedLength(signature),
      sha256(data),
      this.publicKey
    );
  };
}
