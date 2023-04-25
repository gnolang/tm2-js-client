import { Signer } from '../signer';
import { LedgerConnector } from '@cosmjs/ledger-amino';
import { addressPrefix, generateHDPath } from '../utility/utility';
import { HdPath } from '@cosmjs/crypto';
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
    const compressedPubKey: Uint8Array = await this.connector.getPubkey(
      this.hdPath
    );

    return pubkeyToAddress(
      encodeSecp256k1Pubkey(compressedPubKey),
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
