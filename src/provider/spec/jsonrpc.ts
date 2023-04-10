/**
 * The base JSON-RPC 2.0 request
 */
export interface RPCRequest {
  jsonrpc: string;
  id: string | number;
  method: string;

  params?: any[];
}

/**
 * The base JSON-RPC 2.0 response
 */
export interface RPCResponse<Result> {
  jsonrpc: string;
  id: string | number;

  result?: Result;
  error?: RPCError;
}

/**
 * The base JSON-RPC 2.0 typed response error
 */
export interface RPCError {
  code: number;
  message: string;

  data?: any;
}
