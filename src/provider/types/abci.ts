export interface ABCIResponse {
  response: {
    ResponseBase: ABCIResponseBase;
    Key: string | null;
    Value: string | null;
    Proof: MerkleProof | null;
    Height: string;
  };
}

export interface ABCIResponseBase {
  Error: {
    // ABCIErrorKey
    [key: string]: string;
  } | null;
  Data: string | null;
  Events: string | null;
  Log: string;
  Info: string;
}

interface MerkleProof {
  ops: {
    type: string;
    key: string | null;
    data: string | null;
  }[];
}

export interface ABCIAccount {
  BaseAccount: {
    // the associated account address
    address: string;
    // the balance list
    coins: string;
    // the public key info
    public_key: {
      // type of public key
      '@type': string;
      // public key value
      value: string;
    } | null;
    // the account number (state-dependent) (decimal)
    account_number: string;
    // the account sequence / nonce (decimal)
    sequence: string;
  };
}

export interface ABCIResponseSimulateTx {
  Error: string | null;
  Data: string | null;
  Events: any[] | null;
  GasWanted: number;
  GasUsed: number;
}

export const ABCIErrorKey = '@type';
