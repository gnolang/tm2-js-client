import { Provider } from '../provider';
import {
  BlockResult,
  ConsensusParams,
  ConsensusState,
  consensusStateKey,
  NetworkInfo,
  Status,
} from '../types';
import { RestService } from '../../services/rest/restService';
import { newRequest, parseABCI } from '../spec/utility';
import {
  ABCIEndpoint,
  BlockEndpoint,
  CommonEndpoint,
  ConsensusEndpoint,
} from '../endpoints';
import { ABCIResponse } from '../spec/abci';
import { ABCIAccount } from '../abciTypes';

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

  async getBlock(height: number): Promise<BlockResult> {
    return await RestService.post<BlockResult>(this.baseURL, {
      request: newRequest(BlockEndpoint.BLOCK, [height.toString()]),
    });
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
