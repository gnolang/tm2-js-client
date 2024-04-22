/**
 * The transaction payload that is signed to generate
 * a valid transaction signature
 */
export interface TxSignPayload {
  // the ID of the chain
  chain_id: string;
  // the account number of the
  // account that's signing (decimal)
  account_number: string;
  // the sequence number of the
  // account that's signing (decimal)
  sequence: string;
  // the fee of the transaction
  fee: {
    // gas price of the transaction
    // in the format <amount (decimal)><denomination>
    gas_fee: string;
    // gas limit of the transaction (decimal)
    gas_wanted: string;
  };
  // the messages associated
  // with the transaction.
  // These messages have the form: \
  // @type: ...
  // value: ...
  msgs: any[];
  // the transaction memo
  memo: string;
}

export const Secp256k1PubKeyType = '/tm.PubKeySecp256k1';
