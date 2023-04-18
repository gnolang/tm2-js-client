import { Provider } from '../provider';
import {
  BlockInfo,
  BlockResult,
  BroadcastTxResult,
  ConsensusParams,
  ConsensusState,
  consensusStateKey,
  NetworkInfo,
  Status,
  Tx,
} from '../types';
import { RestService } from '../../services/rest/restService';
import {
  base64ToUint8Array,
  newRequest,
  parseABCI,
  uint8ArrayToBase64,
} from '../spec/utility';
import {
  ABCIEndpoint,
  BlockEndpoint,
  CommonEndpoint,
  ConsensusEndpoint,
  TransactionEndpoint,
} from '../endpoints';
import { ABCIResponse } from '../spec/abci';
import { ABCIAccount } from '../abciTypes';
import { sha256 } from '@cosmjs/crypto';

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
    return await RestService.post<Status>(this.baseURL, {
      request: newRequest(CommonEndpoint.STATUS),
    });
  }

  async getTransaction(hash: string, height: number): Promise<Tx | null> {
    const block: BlockInfo = await this.getBlock(height);

    // Check if there are any transactions at all in the block
    if (!block.block.data.txs || block.block.data.txs.length == 0) {
      return null;
    }

    for (let tx of block.block.data.txs) {
      // Decode the base-64 transaction
      const txRaw = base64ToUint8Array(tx);

      // Calculate the transaction hash
      const txHash = sha256(txRaw);

      // TODO change the type of hash to be a byte slice, instead of base64 string
      if (uint8ArrayToBase64(txHash) == hash) {
        // Unmarshal it from amino
        // TODO
        return null;
      }
    }

    return null;
  }

  async sendTransaction(tx: string): Promise<string> {
    const response: BroadcastTxResult =
      await RestService.post<BroadcastTxResult>(this.baseURL, {
        request: newRequest(TransactionEndpoint.BROADCAST_TX_SYNC, [tx]),
      });

    return response.hash;
  }

  waitForTransaction(hash: string, timeout?: number): Promise<Tx> {
    return Promise.reject('implement me');
  }
}
