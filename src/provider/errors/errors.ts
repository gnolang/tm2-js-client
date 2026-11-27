class TM2Error extends Error {
  public log?: string;

  constructor(message: string, log?: string) {
    super(message);

    this.log = log;
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
  CodeExecutionRefusedError,
  RPCRequestError,
  TM2Error,
};
