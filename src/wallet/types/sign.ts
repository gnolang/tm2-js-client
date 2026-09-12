/**
 * The transaction payload that is signed to generate
 * a valid transaction signature
 */
export interface TxSignPayload {
  // the ID of the chain
  chain_id: string
  // the account number of the
  // account that's signing (decimal)
  account_number: string
  // the sequence number of the
  // account that's signing (decimal)
  sequence: string
  // the fee of the transaction, 
  // in the shape accepted by the Ledger Cosmos app
  fee: {
    // gas fee coins of the transaction
    amount: TxSignCoin[]
    // gas limit of the transaction (decimal)
    gas: string
  }
  // the messages associated
  // with the transaction.
  // These messages have the form: \
  // @type: ...
  // value: ...

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msgs: any[]
  // the transaction memo
  memo: string
}

/**
 * A coin as it appears in the signature payload
 */
export interface TxSignCoin {
  // the coin denomination
  denom: string
  // the coin amount (decimal)
  amount: string
}

export const Secp256k1PubKeyType = "/tm.PubKeySecp256k1";
