import { Provider } from '../provider';
import {
  ABCIResponse,
  BlockInfo,
  BlockResult,
  BroadcastTxCommitResult,
  BroadcastTxSyncResult,
  ConsensusParams,
  NetworkInfo,
  RPCRequest,
  Status,
} from '../types';
import { RestService } from '../../services';
import {
  extractAccountNumberFromResponse,
  extractBalanceFromResponse,
  extractSequenceFromResponse,
  newRequest,
  waitForTransaction,
} from '../utility';
import {
  ABCIEndpoint,
  BlockEndpoint,
  CommonEndpoint,
  ConsensusEndpoint,
  TransactionEndpoint,
} from '../endpoints';
import { Tx } from '../../proto';

/**
 * Provider based on JSON-RPC HTTP requests
 */
export class JSONRPCProvider implements Provider {
  protected readonly baseURL: string;

  /**
   * Creates a new instance of the JSON-RPC Provider
   * @param {string} baseURL the JSON-RPC URL of the node
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  estimateGas(tx: Tx): Promise<number> {
    return Promise.reject('not supported');
  }

  async getBalance(
    address: string,
    denomination?: string,
    height?: number
  ): Promise<number> {
    const abciResponse: ABCIResponse = await RestService.post<ABCIResponse>(
      this.baseURL,
      {
        request: newRequest(ABCIEndpoint.ABCI_QUERY, [
          `bank/balances/${address}`,
          '',
          '0', // Height; not supported > 0 for now
          false,
        ]),
      }
    );

    return extractBalanceFromResponse(
      abciResponse.response.ResponseBase.Data,
      denomination ? denomination : 'ugnot'
    );
  }

  async getBlock(height: number): Promise<BlockInfo> {
    return await RestService.post<BlockInfo>(this.baseURL, {
      request: newRequest(BlockEndpoint.BLOCK, [height.toString()]),
    });
  }

  async getBlockResult(height: number): Promise<BlockResult> {
    return await RestService.post<BlockResult>(this.baseURL, {
      request: newRequest(BlockEndpoint.BLOCK_RESULTS, [height.toString()]),
    });
  }

  async getBlockNumber(): Promise<number> {
    // Fetch the status for the latest info
    const status = await this.getStatus();

    return parseInt(status.sync_info.latest_block_height);
  }

  async getConsensusParams(height: number): Promise<ConsensusParams> {
    return await RestService.post<ConsensusParams>(this.baseURL, {
      request: newRequest(ConsensusEndpoint.CONSENSUS_PARAMS, [
        height.toString(),
      ]),
    });
  }

  getGasPrice(): Promise<number> {
    return Promise.reject('not supported');
  }

  async getNetwork(): Promise<NetworkInfo> {
    return await RestService.post<NetworkInfo>(this.baseURL, {
      request: newRequest(ConsensusEndpoint.NET_INFO),
    });
  }

  async getAccountSequence(address: string, height?: number): Promise<number> {
    const abciResponse: ABCIResponse = await RestService.post<ABCIResponse>(
      this.baseURL,
      {
        request: newRequest(ABCIEndpoint.ABCI_QUERY, [
          `auth/accounts/${address}`,
          '',
          '0', // Height; not supported > 0 for now
          false,
        ]),
      }
    );

    return extractSequenceFromResponse(abciResponse.response.ResponseBase.Data);
  }

  async getAccountNumber(address: string, height?: number): Promise<number> {
    const abciResponse: ABCIResponse = await RestService.post<ABCIResponse>(
      this.baseURL,
      {
        request: newRequest(ABCIEndpoint.ABCI_QUERY, [
          `auth/accounts/${address}`,
          '',
          '0', // Height; not supported > 0 for now
          false,
        ]),
      }
    );

    return extractAccountNumberFromResponse(
      abciResponse.response.ResponseBase.Data
    );
  }

  async getStatus(): Promise<Status> {
    return await RestService.post<Status>(this.baseURL, {
      request: newRequest(CommonEndpoint.STATUS),
    });
  }

  async sendTransaction(
    tx: string,
    endpoint?:
      | TransactionEndpoint.BROADCAST_TX_SYNC
      | TransactionEndpoint.BROADCAST_TX_COMMIT
  ): Promise<string> {
    const queryEndpoint = endpoint
      ? endpoint
      : TransactionEndpoint.BROADCAST_TX_SYNC;

    const request: RPCRequest = newRequest(queryEndpoint, [tx]);

    if (queryEndpoint == TransactionEndpoint.BROADCAST_TX_SYNC) {
      return this.broadcastTxSync(request);
    }

    // The endpoint is a commit broadcast
    // (it waits for the transaction to be committed) to the chain before returning
    return this.broadcastTxCommit(request);
  }

  private async broadcastTxSync(request: RPCRequest): Promise<string> {
    const response: BroadcastTxSyncResult =
      await RestService.post<BroadcastTxSyncResult>(this.baseURL, {
        request,
      });

    // Check if there is an immediate tx-broadcast error
    // (originating from basic transaction checks like CheckTx)
    if (response.error) {
      const errType: string = response.error.ABCIErrorKey;
      const log: string = response.Log;

      throw new Error(`${errType}: ${log}`);
    }

    return response.hash;
  }

  private async broadcastTxCommit(request: RPCRequest): Promise<string> {
    const response: BroadcastTxCommitResult =
      await RestService.post<BroadcastTxCommitResult>(this.baseURL, {
        request,
      });

    const { check_tx, deliver_tx } = response;

    // Check if there is an immediate tx-broadcast error (in CheckTx)
    if (check_tx.ResponseBase.Error) {
      const errType: string = check_tx.ResponseBase.Error.ABCIErrorKey;
      const log: string = check_tx.ResponseBase.Log;

      throw new Error(`${errType}: ${log}`);
    }

    // Check if there is a parsing error with the transaction (in DeliverTx)
    if (deliver_tx.ResponseBase.Error) {
      const errType: string = deliver_tx.ResponseBase.Error.ABCIErrorKey;
      const log: string = deliver_tx.ResponseBase.Log;

      throw new Error(`${errType}: ${log}`);
    }

    return response.hash;
  }

  async waitForTransaction(
    hash: string,
    fromHeight?: number,
    timeout?: number
  ): Promise<Tx> {
    return waitForTransaction(this, hash, fromHeight, timeout);
  }
}
