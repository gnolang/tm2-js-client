export interface CreateWalletOptions {
  // the address prefix
  addressPrefix?: string;
  // the requested account index
  accountIndex?: number;
}

export type AccountWalletOption = Pick<CreateWalletOptions, 'addressPrefix'>;
