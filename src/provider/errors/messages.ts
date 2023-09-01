// Errors constructed from:
// https://github.com/gnolang/gno/blob/master/tm2/pkg/std/errors.go

const InternalErrorMessage = 'internal error encountered';
const TxDecodeErrorMessage = 'unable to decode tx';
const InvalidSequenceErrorMessage = 'invalid sequence';
const UnauthorizedErrorMessage = 'signature is unauthorized';
const InsufficientFundsErrorMessage = 'insufficient funds';
const UnknownRequestErrorMessage = 'unknown request';
const InvalidAddressErrorMessage = 'invalid address';
const UnknownAddressErrorMessage = 'unknown address';
const InvalidPubKeyErrorMessage = 'invalid pubkey';
const InsufficientCoinsErrorMessage = 'insufficient coins';
const InvalidCoinsErrorMessage = 'invalid coins';
const InvalidGasWantedErrorMessage = 'invalid gas wanted';
const OutOfGasErrorMessage = 'out of gas';
const MemoTooLargeErrorMessage = 'memo too large';
const InsufficientFeeErrorMessage = 'insufficient fee';
const TooManySignaturesErrorMessage = 'too many signatures';
const NoSignaturesErrorMessage = 'no signatures';
const GasOverflowErrorMessage = 'gas overflow';

export {
  InternalErrorMessage,
  TxDecodeErrorMessage,
  InvalidSequenceErrorMessage,
  UnauthorizedErrorMessage,
  InsufficientFundsErrorMessage,
  UnknownRequestErrorMessage,
  InvalidAddressErrorMessage,
  UnknownAddressErrorMessage,
  InvalidPubKeyErrorMessage,
  InsufficientCoinsErrorMessage,
  InvalidCoinsErrorMessage,
  InvalidGasWantedErrorMessage,
  OutOfGasErrorMessage,
  MemoTooLargeErrorMessage,
  InsufficientFeeErrorMessage,
  TooManySignaturesErrorMessage,
  NoSignaturesErrorMessage,
  GasOverflowErrorMessage,
};
