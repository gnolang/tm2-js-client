import { Provider } from '../provider';
import {
  ConsensusParams,
  ConsensusState,
  consensusStateKey,
  NetworkInfo,
  Status,
} from '../types';
import { RestService } from '../../services/rest/restService';
import { newRequest } from '../spec/utility';
import { CommonEndpoint, ConsensusEndpoint } from '../endpoints';

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

  async getBlockNumber(): Promise<number> {
    // Fetch the state
    const state = await RestService.post<ConsensusState>(this.baseURL, {
      request: newRequest(ConsensusEndpoint.CONSENSUS_STATE),
    });

    // Get the height / round / step info
    const stateStr: string = state.round_state[consensusStateKey] as string;

    return parseInt(stateStr.split('/')[0]);
  }

  getBlockWithTransactions(height: number): Promise<any> {
    return Promise.reject('implement me');
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

  getSequence(address: string, height?: number): Promise<number> {
    return Promise.reject('implement me');
  }

  async getStatus(): Promise<Status> {
    return await RestService.post<Status>(this.baseURL, {
      request: newRequest(CommonEndpoint.STATUS),
    });
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
