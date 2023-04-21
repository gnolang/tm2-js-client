import { Signer } from '../signer';
import { LedgerConnector } from '@cosmjs/ledger-amino';

/**
 * LedgerSigner implements the logic for the Ledger device signer
 */
export class LedgerSigner implements Signer {
  private connector: LedgerConnector;
  private accountIndex: number;

  constructor(connector: LedgerConnector, accountIndex: number) {
    this.connector = connector;
    this.accountIndex = accountIndex;
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
