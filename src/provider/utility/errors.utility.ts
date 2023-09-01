import {
  GasOverflowError,
  InsufficientCoinsError,
  InsufficientFeeError,
  InsufficientFundsError,
  InternalError,
  InvalidAddressError,
  InvalidCoinsError,
  InvalidGasWantedError,
  InvalidPubKeyError,
  InvalidSequenceError,
  MemoTooLargeError,
  NoSignaturesError,
  OutOfGasError,
  TM2Error,
  TooManySignaturesError,
  TxDecodeError,
  UnauthorizedError,
  UnknownAddressError,
  UnknownRequestError,
} from '../errors';

/**
 * Constructs the appropriate Tendermint2
 * error based on the error ID.
 * Error IDs retrieved from:
 * https://github.com/gnolang/gno/blob/64f0fd0fa44021a076e1453b1767fbc914ed3b66/tm2/pkg/std/package.go#L20C1-L38
 * @param {string} errorID the proto ID of the error
 * @param {string} [log] the log associated with the error, if any
 * @returns {TM2Error}
 */
export const constructRequestError = (
  errorID: string,
  log?: string
): TM2Error => {
  switch (errorID) {
    case '/std.InternalError':
      return new InternalError(log);
    case '/std.TxDecodeError':
      return new TxDecodeError(log);
    case '/std.InvalidSequenceError':
      return new InvalidSequenceError(log);
    case '/std.UnauthorizedError':
      return new UnauthorizedError(log);
    case '/std.InsufficientFundsError':
      return new InsufficientFundsError(log);
    case '/std.UnknownRequestError':
      return new UnknownRequestError(log);
    case '/std.InvalidAddressError':
      return new InvalidAddressError(log);
    case '/std.UnknownAddressError':
      return new UnknownAddressError(log);
    case '/std.InvalidPubKeyError':
      return new InvalidPubKeyError(log);
    case '/std.InsufficientCoinsError':
      return new InsufficientCoinsError(log);
    case '/std.InvalidCoinsError':
      return new InvalidCoinsError(log);
    case '/std.InvalidGasWantedError':
      return new InvalidGasWantedError(log);
    case '/std.OutOfGasError':
      return new OutOfGasError(log);
    case '/std.MemoTooLargeError':
      return new MemoTooLargeError(log);
    case '/std.InsufficientFeeError':
      return new InsufficientFeeError(log);
    case '/std.TooManySignaturesError':
      return new TooManySignaturesError(log);
    case '/std.NoSignaturesError':
      return new NoSignaturesError(log);
    case '/std.GasOverflowError':
      return new GasOverflowError(log);
    default:
      return new TM2Error('unknown error');
  }
};
