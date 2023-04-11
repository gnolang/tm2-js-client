import { Provider } from '../provider';
import { ConsensusParams, NetworkInfo, Status } from '../types';
import { RPCRequest, RPCResponse } from '../spec/jsonrpc';

/**
 * Provider based on WS JSON-RPC HTTP requests
 */
export class WSProvider implements Provider {
  private ws: WebSocket; // the persistent WS connection
  private requestMap: Map<
    number | string,
    {
      resolve: (response: RPCResponse<any>) => void;
      reject: (reason: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map(); // callback method map for the individual endpoints
  private requestTimeout = 15000; // 15s

  /**
   * Creates a new instance of the {@link WSProvider}
   * @param {string} baseURL the WS URL of the node
   * @param {number} requestTimeout the timeout for the WS request (in MS)
   */
  constructor(baseURL: string, requestTimeout?: number) {
    this.ws = new WebSocket(baseURL);
    this.ws.addEventListener('message', (event) => {
      const response = JSON.parse(event.data) as RPCResponse<any>;
      const request = this.requestMap.get(response.id);
      if (request) {
        this.requestMap.delete(response.id);
        clearTimeout(request.timeout);

        request.resolve(response);
      }

      // Set the default timeout
      this.requestTimeout = requestTimeout ? requestTimeout : 15000;
    });
  }

  /**
   * Sends a request to the WS connection, and resolves
   * upon receiving the response
   * @param {RPCRequest} request the RPC request
   * @returns {Promise<RPCResponse<any>>} the RPC response
   */
  sendRequest(request: RPCRequest): Promise<RPCResponse<any>> {
    // The promise will resolve as soon as the response is received
    const promise = new Promise<RPCResponse<any>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestMap.delete(request.id);

        reject(new Error('Request timed out'));
      }, this.requestTimeout);

      this.requestMap.set(request.id, { resolve, reject, timeout });
    });

    this.ws.send(JSON.stringify(request));

    return promise;
  }

  estimateGas(tx: any): Promise<number> {
    return Promise.reject('implement me');
  }

  getBalance(
    address: string,
    denomination?: string,
    height?: number
  ): Promise<number> {
    return Promise.reject('implement me');
  }

  getBlock(height: number): Promise<any> {
    return Promise.reject('implement me');
  }

  getBlockNumber(): Promise<number> {
    return Promise.reject('implement me');
  }

  getBlockWithTransactions(height: number): Promise<any> {
    return Promise.reject('implement me');
  }

  getConsensusParams(height: number): Promise<ConsensusParams> {
    return Promise.reject('implement me');
  }

  getGasPrice(): Promise<number> {
    return Promise.reject('implement me');
  }

  getNetwork(): Promise<NetworkInfo> {
    return Promise.reject('implement me');
  }

  getSequence(address: string, height?: number): Promise<number> {
    return Promise.reject('implement me');
  }

  getStatus(): Promise<Status> {
    return Promise.reject('implement me');
  }

  getTransaction(hash: any): Promise<any> {
    return Promise.reject('implement me');
  }

  getTransactionCommit(hash: any): Promise<any> {
    return Promise.reject('implement me');
  }

  sendTransaction(tx: any): Promise<any> {
    return Promise.reject('implement me');
  }

  waitForTransaction(hash: any, timeout?: number): Promise<any> {
    return Promise.reject('implement me');
  }
}
