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

  signData = async (data: Uint8Array): Promise<Uint8Array> => {
    if (!this.connector) {
      throw new Error('Ledger not connected');
    }

    return this.connector.sign(
      sha256(data), // TODO verify this is the case
      this.hdPath
    );
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
