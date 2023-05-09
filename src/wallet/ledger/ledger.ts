import { Signer } from '../signer';
import { LedgerConnector } from '@cosmjs/ledger-amino';
import { addressPrefix, generateHDPath } from '../utility';
import { HdPath, Secp256k1, Secp256k1Signature, sha256 } from '@cosmjs/crypto';
import { encodeSecp256k1Pubkey, pubkeyToAddress } from '@cosmjs/amino';

/**
 * LedgerSigner implements the logic for the Ledger device signer
 */
export class LedgerSigner implements Signer {
  private readonly connector: LedgerConnector;
  private readonly hdPath: HdPath;

  /**
   * Creates a new Ledger device signer instance
   * @param {LedgerConnector} connector the Ledger connector
   * @param {number} accountIndex the desired account index
   */
  constructor(connector: LedgerConnector, accountIndex: number) {
    this.connector = connector;
    this.hdPath = generateHDPath(accountIndex);
  }

  getAddress = async (): Promise<string> => {
    if (!this.connector) {
      throw new Error('Ledger not connected');
    }

    const compressedPubKey: Uint8Array = await this.connector.getPubkey(
      this.hdPath
    );

    return pubkeyToAddress(
      encodeSecp256k1Pubkey(compressedPubKey),
      addressPrefix
    );
  };

  getPublicKey = async (): Promise<Uint8Array> => {
    if (!this.connector) {
      throw new Error('Ledger not connected');
    }

    return this.connector.getPubkey(this.hdPath);
  };

  getPrivateKey = async (): Promise<Uint8Array> => {
    throw new Error('Ledger does not support private key');
  };

  signData = async (data: Uint8Array): Promise<Uint8Array> => {
    if (!this.connector) {
      throw new Error('Ledger not connected');
    }

    return this.connector.sign(data, this.hdPath);
  };

  verifySignature = async (
    data: Uint8Array,
    signature: Uint8Array
  ): Promise<boolean> => {
    const publicKey = await this.getPublicKey();

    return Secp256k1.verifySignature(
      Secp256k1Signature.fromFixedLength(signature),
      sha256(data),
      publicKey
    );
  };
}
