import { RPCError, RPCRequest, RPCResponse } from './jsonrpc';

// The version of the supported JSON-RPC protocol
const standardVersion = '2.0';

/**
 * Creates a new JSON-RPC 2.0 request
 * @param {string} method the requested method
 * @param {string[]} [params] the requested params, if any
 * @returns {RPCRequest} the created request object
 */
export const newRequest = (method: string, params?: any[]): RPCRequest => {
  return {
    // the ID of the request is not that relevant for this helper method;
    // for finer ID control, instantiate the request object directly
    id: Date.now(),
    jsonrpc: standardVersion,
    method: method,
    params: params,
  };
};

/**
 * Creates a new JSON-RPC 2.0 response
 * @param {Result} result the response result, if any
 * @param {RPCError} error the response error, if any
 * @returns {RPCResponse<Result>} the created response object
 */
export const newResponse = <Result>(
  result?: Result,
  error?: RPCError
): RPCResponse<Result> => {
  return {
    id: Date.now(),
    jsonrpc: standardVersion,
    result: result,
    error: error,
  };
};

/**
 * Parses the base64 encoded ABCI JSON into a concrete type
 * @param {string} data the base64-encoded JSON
 * @returns {Result} the extracted response
 */
export const parseABCI = <Result>(data: string): Result => {
  const jsonData: string = Buffer.from(data, 'base64').toString();
  const parsedData: Result | null = JSON.parse(jsonData);

  if (!parsedData) {
    throw new Error('unable to parse JSON response');
  }

  return parsedData;
};

/**
 * Converts a string into base64 representation
 * @param {string} str the raw string
 * @returns {string} the base64 representation of the string
 */
export const stringToBase64 = (str: string): string => {
  const buffer = Buffer.from(str, 'utf-8');

  return buffer.toString('base64');
};

/**
 * Converts a base64 string into a Uint8Array representation
 * @param {string} str the base64-encoded string
 * @returns {string} the Uint8Array representation of the string
 */
export const base64ToUint8Array = (str: string): Uint8Array => {
  const buffer = Buffer.from(str, 'base64');

  return new Uint8Array(buffer);
};

/**
 * Converts a Uint8Array into base64 representation
 * @param {Uint8Array} data the Uint8Array to be encoded
 * @returns {string} the base64-encoded data
 */
export const uint8ArrayToBase64 = (data: Uint8Array): string => {
  return Buffer.from(data).toString('base64');
};
