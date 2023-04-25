import { Signer } from '../signer';
import { encodeSecp256k1Pubkey, pubkeyToAddress } from '@cosmjs/amino';
import { Secp256k1 } from '@cosmjs/crypto';
import { addressPrefix } from '../utility/utility';

/**
 * KeySigner implements the logic for the private key signer
 */
export class KeySigner implements Signer {
  private readonly privateKey: Uint8Array; // the raw private key
  private readonly publicKey: Uint8Array; // the compressed public key

  constructor(privateKey: Uint8Array, publicKey: Uint8Array) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  getAddress = async (): Promise<string> => {
    return pubkeyToAddress(
      encodeSecp256k1Pubkey(Secp256k1.compressPubkey(this.publicKey)),
      addressPrefix
    );
  };

  getPublicKey(): any {
    // TODO
  }

  signData(data: any): any {
    // TODO
  }

  signTransaction(tx: any): any {
    // TODO
  }
}
