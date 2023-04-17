import { Provider } from '../provider';
import {
  BlockInfo,
  BlockResult,
  ConsensusParams,
  ConsensusState,
  consensusStateKey,
  NetworkInfo,
  Status,
} from '../types';
import { RPCRequest, RPCResponse } from '../spec/jsonrpc';
import { newRequest, parseABCI } from '../spec/utility';
import {
  ABCIEndpoint,
  BlockEndpoint,
  CommonEndpoint,
  ConsensusEndpoint,
} from '../endpoints';
import { WebSocket } from 'ws';
import { ABCIResponse } from '../spec/abci';
import { ABCIAccount } from '../abciTypes';

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
      const response = JSON.parse(event.data as string) as RPCResponse<any>;
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
   * Closes the WS connection. Required when done working
   * with the WS provider
   */
  closeConnection() {
    this.ws.close();
  }

  /**
   * Sends a request to the WS connection, and resolves
   * upon receiving the response
   * @param {RPCRequest} request the RPC request
   * @returns {Promise<RPCResponse<any>>} the RPC response
   */
  async sendRequest<Result>(request: RPCRequest): Promise<RPCResponse<Result>> {
    // Make sure the connection is open
    if (this.ws.readyState != WebSocket.OPEN) {
      await this.waitForOpenConnection();
    }

    // The promise will resolve as soon as the response is received
    const promise = new Promise<RPCResponse<Result>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requestMap.delete(request.id);

        reject(new Error('Request timed out'));
      }, this.requestTimeout);

      this.requestMap.set(request.id, { resolve, reject, timeout });
    });

    this.ws.send(JSON.stringify(request));

    return promise;
  }

  /**
   * Parses the result from the response
   * @param {RPCResponse<Result>} response the response to be parsed
   * @returns {Result} the result of the response
   */
  parseResponse<Result>(response: RPCResponse<Result>): Result {
    if (!response) {
      throw new Error('invalid response');
    }

    if (response.error) {
      throw new Error(response.error?.message);
    }

    if (!response.result) {
      throw new Error('invalid response returned');
    }

    return response.result;
  }

  /**
   * Waits for the WS connection to be established
   * @returns {Promise<null>} resolve / reject indicating success
   */
  waitForOpenConnection = () => {
    return new Promise((resolve, reject) => {
      const maxNumberOfAttempts = 10;
      const intervalTime = 200; //ms

      let currentAttempt = 0;
      const interval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve(null);
        }

        currentAttempt++;
        if (currentAttempt > maxNumberOfAttempts - 1) {
          clearInterval(interval);
          reject(new Error('Maximum number of attempts exceeded'));
        }
      }, intervalTime);
    });
  };

  estimateGas(tx: any): Promise<number> {
    return Promise.reject('implement me');
  }

  async getBalance(
    address: string,
    denomination?: string,
    height?: number
  ): Promise<number> {
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `auth/accounts/${address}`,
        '',
        '0', // Height; not supported > 0 for now
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    // Make sure the response is initialized
    if (!abciResponse.response.ResponseBase.Data) {
      return 0;
    }

    // Extract the balances
    const balancesRaw = Buffer.from(
      abciResponse.response.ResponseBase.Data,
      'base64'
    ).toString();

    // Find the correct balance denomination
    const balances: string[] = balancesRaw.split(',');
    if (balances.length < 1) {
      return 0;
    }

    // Find the correct denomination
    const pattern = new RegExp(`^(\\d+)${denomination}$`);
    for (const balance of balances) {
      const match = balance.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return 0;
  }

  async getBlock(height: number): Promise<BlockInfo> {
    const response = await this.sendRequest<BlockInfo>(
      newRequest(BlockEndpoint.BLOCK, [height.toString()])
    );

    return this.parseResponse<BlockInfo>(response);
  }

  async getBlockResult(height: number): Promise<BlockResult> {
    const response = await this.sendRequest<BlockResult>(
      newRequest(BlockEndpoint.BLOCK_RESULTS, [height.toString()])
    );

    return this.parseResponse<BlockResult>(response);
  }

  async getBlockNumber(): Promise<number> {
    const response = await this.sendRequest<ConsensusState>(
      newRequest(ConsensusEndpoint.CONSENSUS_STATE)
    );

    // Parse the response into state
    const state = this.parseResponse<ConsensusState>(response);

    // Get the height / round / step info
    const stateStr: string = state.round_state[consensusStateKey] as string;

    return parseInt(stateStr.split('/')[0]);
  }

  async getConsensusParams(height: number): Promise<ConsensusParams> {
    const response = await this.sendRequest<ConsensusParams>(
      newRequest(ConsensusEndpoint.CONSENSUS_PARAMS, [height.toString()])
    );

    return this.parseResponse<ConsensusParams>(response);
  }

  getGasPrice(): Promise<number> {
    return Promise.reject('implement me');
  }

  async getNetwork(): Promise<NetworkInfo> {
    const response = await this.sendRequest<NetworkInfo>(
      newRequest(ConsensusEndpoint.NET_INFO)
    );

    return this.parseResponse<NetworkInfo>(response);
  }

  async getSequence(address: string, height?: number): Promise<number> {
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `auth/accounts/${address}`,
        '',
        '0', // Height; not supported > 0 for now
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    // Make sure the response is initialized
    if (!abciResponse.response.ResponseBase.Data) {
      return 0;
    }

    try {
      // Parse the account
      const account: ABCIAccount = parseABCI<ABCIAccount>(
        abciResponse.response.ResponseBase.Data
      );

      return parseInt(account.BaseAccount.sequence, 10);
    } catch (e) {
      // Account not initialized,
      // return default value - 0
    }

    return 0;
  }

  async getStatus(): Promise<Status> {
    const response = await this.sendRequest<Status>(
      newRequest(CommonEndpoint.STATUS)
    );

    return this.parseResponse<Status>(response);
  }

  getTransaction(hash: any): Promise<any> {
    return Promise.reject('implement me');
  }

  sendTransaction(tx: any): Promise<any> {
    return Promise.reject('implement me');
  }

  waitForTransaction(hash: any, timeout?: number): Promise<any> {
    return Promise.reject('implement me');
  }
}
