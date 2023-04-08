/**
 * The base JSON-RPC 2.0 request
 */
export interface RPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;

  params?: string[];
}

/**
 * The base JSON-RPC 2.0 response
 */
export interface RPCResponse<Result, Error> {
  jsonrpc: '2.0';
  id: string | number;

  result?: Result;
  error?: RPCError<Error>;
}

/**
 * The base JSON-RPC 2.0 typed response error
 */
export interface RPCError<Data> {
  code: number;
  message: string;

  data?: Data;
}
