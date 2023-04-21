import { Signer } from '../signer';

/**
 * KeySigner implements the logic for the private key signer
 */
export class KeySigner implements Signer {
  constructor(privateKey: Uint8Array, publicKey: Uint8Array) {
    // TODO
  }

  getAddress(): string {
    // TODO
    return '';
  }

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
