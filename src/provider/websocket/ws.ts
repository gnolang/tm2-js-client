import { Tx } from '../../proto';
import {
  ABCIEndpoint,
  BlockEndpoint,
  CommonEndpoint,
  ConsensusEndpoint,
  TransactionEndpoint,
} from '../endpoints';
import { Provider } from '../provider';
import {
  ABCIAccount,
  ABCIErrorKey,
  ABCIResponse,
  BlockInfo,
  BlockResult,
  BroadcastTransactionMap,
  BroadcastTxCommitResult,
  BroadcastTxSyncResult,
  ConsensusParams,
  NetworkInfo,
  RPCRequest,
  RPCResponse,
  Status,
  TxResult,
} from '../types';
import {
  extractAccountFromResponse,
  extractAccountNumberFromResponse,
  extractBalanceFromResponse,
  extractSequenceFromResponse,
  extractSimulateFromResponse,
  newRequest,
  uint8ArrayToBase64,
  waitForTransaction,
} from '../utility';
import { constructRequestError } from '../utility/errors.utility';

/**
 * Provider based on WS JSON-RPC HTTP requests
 */
export class WSProvider implements Provider {
  protected ws: WebSocket; // the persistent WS connection
  protected readonly requestMap: Map<
    number | string,
    {
      resolve: (response: RPCResponse<any>) => void;
      reject: (reason: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map(); // callback method map for the individual endpoints
  protected requestTimeout = 15000; // 15s

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
   */
  waitForOpenConnection = (): Promise<null> => {
    return new Promise((resolve, reject) => {
      const maxNumberOfAttempts = 20;
      const intervalTime = 500; // ms

      let currentAttempt = 0;
      const interval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve(null);
        }

        currentAttempt++;
        if (currentAttempt >= maxNumberOfAttempts) {
          clearInterval(interval);
          reject(new Error('Unable to establish WS connection'));
        }
      }, intervalTime);
    });
  };

  async estimateGas(tx: Tx): Promise<number> {
    const encodedTx = uint8ArrayToBase64(Tx.encode(tx).finish());
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `.app/simulate`,
        `${encodedTx}`,
        '0', // Height; not supported > 0 for now
        false,
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    const simulateResult = extractSimulateFromResponse(abciResponse);

    const resultErrorKey = simulateResult.response_base?.error?.type_url;
    if (resultErrorKey) {
      throw constructRequestError(resultErrorKey);
    }

    return simulateResult.gas_used.toInt();
  }

  async getBalance(
    address: string,
    denomination?: string,
    height?: number
  ): Promise<number> {
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `bank/balances/${address}`,
        '',
        '0', // Height; not supported > 0 for now
        false,
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    return extractBalanceFromResponse(
      abciResponse.response.ResponseBase.Data,
      denomination ? denomination : 'ugnot'
    );
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
    // Fetch the status for the latest info
    const status = await this.getStatus();

    return parseInt(status.sync_info.latest_block_height);
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

  async getAccountSequence(address: string, height?: number): Promise<number> {
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `auth/accounts/${address}`,
        '',
        '0', // Height; not supported > 0 for now
        false,
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    return extractSequenceFromResponse(abciResponse.response.ResponseBase.Data);
  }

  async getAccountNumber(address: string, height?: number): Promise<number> {
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `auth/accounts/${address}`,
        '',
        '0', // Height; not supported > 0 for now
        false,
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    return extractAccountNumberFromResponse(
      abciResponse.response.ResponseBase.Data
    );
  }

  async getAccount(address: string, height?: number): Promise<ABCIAccount> {
    const response = await this.sendRequest<ABCIResponse>(
      newRequest(ABCIEndpoint.ABCI_QUERY, [
        `auth/accounts/${address}`,
        '',
        '0', // Height; not supported > 0 for now
        false,
      ])
    );

    // Parse the response
    const abciResponse = this.parseResponse<ABCIResponse>(response);

    return extractAccountFromResponse(
      abciResponse.response.ResponseBase.Data
    );
  }

  async getStatus(): Promise<Status> {
    const response = await this.sendRequest<Status>(
      newRequest(CommonEndpoint.STATUS)
    );

    return this.parseResponse<Status>(response);
  }

  async getTransaction(hash: string): Promise<TxResult> {
    const response = await this.sendRequest<TxResult>(
      newRequest(TransactionEndpoint.TX, [hash])
    );

    return this.parseResponse<TxResult>(response);
  }

  async sendTransaction<K extends keyof BroadcastTransactionMap>(
    tx: string,
    endpoint: K
  ): Promise<BroadcastTransactionMap[K]['result']> {
    const request: RPCRequest = newRequest(endpoint, [tx]);

    switch (endpoint) {
      case TransactionEndpoint.BROADCAST_TX_COMMIT:
        // The endpoint is a commit broadcast
        // (it waits for the transaction to be committed) to the chain before returning
        return this.broadcastTxCommit(request);
      case TransactionEndpoint.BROADCAST_TX_SYNC:
      default:
        return this.broadcastTxSync(request);
    }
  }

  private async broadcastTxSync(
    request: RPCRequest
  ): Promise<BroadcastTxSyncResult> {
    const response: RPCResponse<BroadcastTxSyncResult> =
      await this.sendRequest<BroadcastTxSyncResult>(request);

    const broadcastResponse: BroadcastTxSyncResult =
      this.parseResponse<BroadcastTxSyncResult>(response);

    // Check if there is an immediate tx-broadcast error
    // (originating from basic transaction checks like CheckTx)
    if (broadcastResponse.error) {
      const errType: string = broadcastResponse.error[ABCIErrorKey];
      const log: string = broadcastResponse.Log;

      throw constructRequestError(errType, log);
    }

    return broadcastResponse;
  }

  private async broadcastTxCommit(
    request: RPCRequest
  ): Promise<BroadcastTxCommitResult> {
    const response: RPCResponse<BroadcastTxCommitResult> =
      await this.sendRequest<BroadcastTxCommitResult>(request);

    const broadcastResponse: BroadcastTxCommitResult =
      this.parseResponse<BroadcastTxCommitResult>(response);

    const { check_tx, deliver_tx } = broadcastResponse;

    // Check if there is an immediate tx-broadcast error (in CheckTx)
    if (check_tx.ResponseBase.Error) {
      const errType: string = check_tx.ResponseBase.Error[ABCIErrorKey];
      const log: string = check_tx.ResponseBase.Log;

      throw constructRequestError(errType, log);
    }

    // Check if there is a parsing error with the transaction (in DeliverTx)
    if (deliver_tx.ResponseBase.Error) {
      const errType: string = deliver_tx.ResponseBase.Error[ABCIErrorKey];
      const log: string = deliver_tx.ResponseBase.Log;

      throw constructRequestError(errType, log);
    }

    return broadcastResponse;
  }

  waitForTransaction(
    hash: string,
    fromHeight?: number,
    timeout?: number
  ): Promise<Tx> {
    return waitForTransaction(this, hash, fromHeight, timeout);
  }
}
