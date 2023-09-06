import {
  GasOverflowErrorMessage,
  InsufficientCoinsErrorMessage,
  InsufficientFeeErrorMessage,
  InsufficientFundsErrorMessage,
  InternalErrorMessage,
  InvalidAddressErrorMessage,
  InvalidCoinsErrorMessage,
  InvalidGasWantedErrorMessage,
  InvalidPubKeyErrorMessage,
  InvalidSequenceErrorMessage,
  MemoTooLargeErrorMessage,
  NoSignaturesErrorMessage,
  OutOfGasErrorMessage,
  TooManySignaturesErrorMessage,
  TxDecodeErrorMessage,
  UnauthorizedErrorMessage,
  UnknownAddressErrorMessage,
  UnknownRequestErrorMessage,
} from './messages';

class TM2Error extends Error {
  public log?: string;

  constructor(message: string, log?: string) {
    super(message);

    this.log = log;
  }
}

class InternalError extends TM2Error {
  constructor(log?: string) {
    super(InternalErrorMessage, log);
  }
}

class TxDecodeError extends TM2Error {
  constructor(log?: string) {
    super(TxDecodeErrorMessage, log);
  }
}

class InvalidSequenceError extends TM2Error {
  constructor(log?: string) {
    super(InvalidSequenceErrorMessage, log);
  }
}

class UnauthorizedError extends TM2Error {
  constructor(log?: string) {
    super(UnauthorizedErrorMessage, log);
  }
}

class InsufficientFundsError extends TM2Error {
  constructor(log?: string) {
    super(InsufficientFundsErrorMessage, log);
  }
}

class UnknownRequestError extends TM2Error {
  constructor(log?: string) {
    super(UnknownRequestErrorMessage, log);
  }
}

class InvalidAddressError extends TM2Error {
  constructor(log?: string) {
    super(InvalidAddressErrorMessage, log);
  }
}

class UnknownAddressError extends TM2Error {
  constructor(log?: string) {
    super(UnknownAddressErrorMessage, log);
  }
}

class InvalidPubKeyError extends TM2Error {
  constructor(log?: string) {
    super(InvalidPubKeyErrorMessage, log);
  }
}

class InsufficientCoinsError extends TM2Error {
  constructor(log?: string) {
    super(InsufficientCoinsErrorMessage, log);
  }
}

class InvalidCoinsError extends TM2Error {
  constructor(log?: string) {
    super(InvalidCoinsErrorMessage, log);
  }
}

class InvalidGasWantedError extends TM2Error {
  constructor(log?: string) {
    super(InvalidGasWantedErrorMessage, log);
  }
}

class OutOfGasError extends TM2Error {
  constructor(log?: string) {
    super(OutOfGasErrorMessage, log);
  }
}

class MemoTooLargeError extends TM2Error {
  constructor(log?: string) {
    super(MemoTooLargeErrorMessage, log);
  }
}

class InsufficientFeeError extends TM2Error {
  constructor(log?: string) {
    super(InsufficientFeeErrorMessage, log);
  }
}

class TooManySignaturesError extends TM2Error {
  constructor(log?: string) {
    super(TooManySignaturesErrorMessage, log);
  }
}

class NoSignaturesError extends TM2Error {
  constructor(log?: string) {
    super(NoSignaturesErrorMessage, log);
  }
}

class GasOverflowError extends TM2Error {
  constructor(log?: string) {
    super(GasOverflowErrorMessage, log);
  }
}

export {
  TM2Error,
  InternalError,
  TxDecodeError,
  InvalidSequenceError,
  UnauthorizedError,
  InsufficientFundsError,
  UnknownRequestError,
  InvalidAddressError,
  UnknownAddressError,
  InvalidPubKeyError,
  InsufficientCoinsError,
  InvalidCoinsError,
  InvalidGasWantedError,
  OutOfGasError,
  MemoTooLargeError,
  InsufficientFeeError,
  TooManySignaturesError,
  NoSignaturesError,
  GasOverflowError,
};
