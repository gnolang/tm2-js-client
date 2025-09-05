import { Tx } from '../../proto';
import { RestService } from '../../services';
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

  async estimateGas(tx: Tx): Promise<number> {
    const encodedTx = uint8ArrayToBase64(Tx.encode(tx).finish());
    const abciResponse: ABCIResponse = await RestService.post<ABCIResponse>(
      this.baseURL,
      {
        request: newRequest(ABCIEndpoint.ABCI_QUERY, [
          `.app/simulate`,
          `${encodedTx}`,
          '0', // Height; not supported > 0 for now
          false,
        ]),
      }
    );

    const simulateResult = extractSimulateFromResponse(abciResponse);

    return simulateResult.gas_used.toInt();
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

  async getAccount(address: string, height?: number): Promise<ABCIAccount> {
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

    return extractAccountFromResponse(abciResponse.response.ResponseBase.Data);
  }

  async getStatus(): Promise<Status> {
    return await RestService.post<Status>(this.baseURL, {
      request: newRequest(CommonEndpoint.STATUS, [null]),
    });
  }

  async getTransaction(hash: string): Promise<TxResult> {
    return await RestService.post<TxResult>(this.baseURL, {
      request: newRequest(TransactionEndpoint.TX, [hash]),
    });
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
    const response: BroadcastTxSyncResult =
      await RestService.post<BroadcastTxSyncResult>(this.baseURL, {
        request,
      });

    // Check if there is an immediate tx-broadcast error
    // (originating from basic transaction checks like CheckTx)
    if (response.error) {
      const errType: string = response.error[ABCIErrorKey];
      const log: string = response.Log;

      throw constructRequestError(errType, log);
    }

    return response;
  }

  private async broadcastTxCommit(
    request: RPCRequest
  ): Promise<BroadcastTxCommitResult> {
    const response: BroadcastTxCommitResult =
      await RestService.post<BroadcastTxCommitResult>(this.baseURL, {
        request,
      });

    const { check_tx, deliver_tx } = response;

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

    return response;
  }

  async waitForTransaction(
    hash: string,
    fromHeight?: number,
    timeout?: number
  ): Promise<Tx> {
    return waitForTransaction(this, hash, fromHeight, timeout);
  }
}
