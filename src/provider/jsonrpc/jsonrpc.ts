import { Provider } from '../provider';
import {
  BlockInfo,
  BlockResult,
  BroadcastTxResult,
  ConsensusParams,
  NetworkInfo,
  Status,
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
import { Tx } from '../../proto/tm2/tx';

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
    return new Promise(async (resolve, reject) => {
      // Fetch the starting point
      let currentHeight = fromHeight ? fromHeight : await this.getBlockNumber();

      const fetchInterval = setInterval(async () => {
        // Fetch the latest block height
        const latestHeight = await this.getBlockNumber();

        if (latestHeight < currentHeight) {
          // No need to parse older blocks
          return;
        }

        for (
          let blockNum = currentHeight;
          blockNum <= latestHeight;
          blockNum++
        ) {
          // Fetch the block from the chain
          const block: BlockInfo = await this.getBlock(blockNum);

          // Check if there are any transactions at all in the block
          if (!block.block.data.txs || block.block.data.txs.length == 0) {
            continue;
          }

          // Find the transaction among the block transactions
          for (const tx of block.block.data.txs) {
            // Decode the base-64 transaction
            const txRaw = base64ToUint8Array(tx);

            // Calculate the transaction hash
            const txHash = sha256(txRaw);

            if (uint8ArrayToBase64(txHash) == hash) {
              // Clear the interval
              clearInterval(fetchInterval);

              // Decode the transaction from amino
              resolve(Tx.decode(txRaw));
            }
          }
        }

        currentHeight = latestHeight + 1;
      }, 1000);

      if (timeout) {
        setTimeout(() => {
          // Clear the fetch interval
          clearInterval(fetchInterval);

          reject('transaction fetch timeout');
        }, timeout);
      }
    });
  }
}
