import { Provider } from '../provider';
import {
  BlockInfo,
  BlockResult,
  BroadcastTxResult,
  ConsensusParams,
  NetworkInfo,
  Status,
} from '../types/common';
import { RestService } from '../../services/rest/restService';
import { newRequest } from '../utility/requests.utility';
import {
  ABCIEndpoint,
  BlockEndpoint,
  CommonEndpoint,
  ConsensusEndpoint,
  TransactionEndpoint,
} from '../endpoints';
import { ABCIResponse } from '../types/abci';
import { Tx } from '../../proto/tm2/tx';
import {
  extractBalanceFromResponse,
  extractSequenceFromResponse,
  waitForTransaction,
} from '../utility/provider.utility';

/**
 * Provider based on JSON-RPC HTTP requests
 */
export class JSONRPCProvider implements Provider {
  private readonly baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  estimateGas(tx: any): Promise<number> {
    return Promise.reject('implement me');
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
    return Promise.reject('implement me');
  }

  async getNetwork(): Promise<NetworkInfo> {
    return await RestService.post<NetworkInfo>(this.baseURL, {
      request: newRequest(ConsensusEndpoint.NET_INFO),
    });
  }

  async getSequence(address: string, height?: number): Promise<number> {
    const abciResponse: ABCIResponse = await RestService.post<ABCIResponse>(
      this.baseURL,
      {
        request: newRequest(ABCIEndpoint.ABCI_QUERY, [
          `auth/accounts/${address}`,
          '',
          '0', // Height; not supported > 0 for now
        ]),
      }
    );

    return extractSequenceFromResponse(abciResponse.response.ResponseBase.Data);
  }

  async getStatus(): Promise<Status> {
    return await RestService.post<Status>(this.baseURL, {
      request: newRequest(CommonEndpoint.STATUS),
    });
  }

  async sendTransaction(tx: string): Promise<string> {
    const response: BroadcastTxResult =
      await RestService.post<BroadcastTxResult>(this.baseURL, {
        request: newRequest(TransactionEndpoint.BROADCAST_TX_SYNC, [tx]),
      });

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
