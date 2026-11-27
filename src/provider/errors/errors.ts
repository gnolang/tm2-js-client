class TM2Error extends Error {
  public log?: string;

  constructor(message: string, log?: string) {
    super(message);

    this.log = log;
  }
}

class AccountNotInitializedError extends Error {
  constructor() {
    super("account is not initialized");
  }
}

class AccountDecodeError extends Error {
  constructor(cause: unknown) {
    super("unable to decode account response", {
      cause,
    });
  }
}

class RPCRequestError extends Error {
  public readonly code: number;
  public readonly rpcMessage: string;
  public readonly data?: string;

  constructor(message: string, code: number, rpcMessage: string, data?: string) {
    super(message);

    this.code = code;
    this.rpcMessage = rpcMessage;
    this.data = data;
  }
}

class CodeExecutionRefusedError extends RPCRequestError {}

export {
  AccountDecodeError,
  AccountNotInitializedError,
  CodeExecutionRefusedError,
  RPCRequestError,
  TM2Error,
};
