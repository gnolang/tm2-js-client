export interface ABCIAccount {
  BaseAccount: {
    // the associated account address
    address: string;
    // the balance list
    coins: string;
    // the public key info
    public_key: {
      // type of public key
      type: string;
      // public key value
      value: string;
    } | null;
    // the account number (state-dependent) (decimal)
    account_number: string;
    // the account sequence / nonce (decimal)
    sequence: string;
  };
}
