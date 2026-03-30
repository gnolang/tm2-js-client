import {
  Tm2Client,
} from "@gnolang/tm2-rpc";

import {
  Tx,
} from "../../proto/index.js";
import {
  TransactionEndpoint,
} from "../endpoints.js";
import {
  Provider,
} from "../provider.js";
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
  Status,
  TxResult,
} from "../types/index.js";
import {
  constructRequestError,
} from "../utility/errors.utility.js";
import {
  adaptAbciQueryResponse,
  adaptBlockResponse,
  adaptBlockResultsResponse,
  adaptBroadcastTxCommitResponse,
  adaptBroadcastTxSyncResponse,
  adaptConsensusParamsResponse,
  adaptNetInfoResponse,
  adaptStatusResponse,
  adaptTxResponse,
  extractAccountFromResponse,
  extractAccountNumberFromResponse,
  extractBalanceFromResponse,
  extractSequenceFromResponse,
  extractSimulateFromResponse,
  uint8ArrayToBase64,
  waitForTransaction,
} from "../utility/index.js";

/**
 * Provider based on JSON-RPC HTTP requests
 */
export class JSONRPCProvider implements Provider {
  private readonly client: Tm2Client;

  private constructor(client: Tm2Client) {
    this.client = client;
  }

  /**
   * Creates a new instance of the JSON-RPC Provider
   * @param {string} baseURL the JSON-RPC URL of the node
   */
  static async create(baseURL: string): Promise<JSONRPCProvider> {
    const client = await Tm2Client.connect(baseURL);
    return new JSONRPCProvider(client);
  }

  async estimateGas(tx: Tx): Promise<bigint> {
    const encodedTx = uint8ArrayToBase64(Tx.encode(tx).finish());
    const rpcResponse = await this.client.abciQuery({
      path: ".app/simulate",
      data: new TextEncoder().encode(encodedTx),
      height: 0,
      prove: false,
    });

    const abciResponse: ABCIResponse = adaptAbciQueryResponse(rpcResponse);
    const simulateResult = extractSimulateFromResponse(abciResponse);

    return simulateResult.gas_used;
  }

  async getBalance(
    address: string,
    denomination?: string,
    height?: number,
  ): Promise<number> {
    const rpcResponse = await this.client.abciQuery({
      path: `bank/balances/${address}`,
      data: new Uint8Array(),
      height: height ? height : 0,
      prove: false,
    });

    const abciResponse: ABCIResponse = adaptAbciQueryResponse(rpcResponse);

    return extractBalanceFromResponse(
      abciResponse.response.ResponseBase.Data,
      denomination ? denomination : "ugnot",
    );
  }

  async getBlock(height: number): Promise<BlockInfo> {
    const rpcResponse = await this.client.block(height);
    return adaptBlockResponse(rpcResponse);
  }

  async getBlockResult(height: number): Promise<BlockResult> {
    const rpcResponse = await this.client.blockResults(height);
    return adaptBlockResultsResponse(rpcResponse);
  }

  async getBlockNumber(): Promise<number> {
    const status = await this.getStatus();
    return parseInt(status.sync_info.latest_block_height);
  }

  async getConsensusParams(height: number): Promise<ConsensusParams> {
    const rpcResponse = await this.client.consensusParams(height);
    return adaptConsensusParamsResponse(rpcResponse);
  }

  getGasPrice(): Promise<number> {
    return Promise.reject("not supported");
  }

  async getNetwork(): Promise<NetworkInfo> {
    const rpcResponse = await this.client.netInfo();
    return adaptNetInfoResponse(rpcResponse);
  }

  async getAccountSequence(address: string, height?: number): Promise<number> {
    const rpcResponse = await this.client.abciQuery({
      path: `auth/accounts/${address}`,
      data: new Uint8Array(),
      height: height ? height : 0,
      prove: false,
    });

    const abciResponse: ABCIResponse = adaptAbciQueryResponse(rpcResponse);
    return extractSequenceFromResponse(abciResponse.response.ResponseBase.Data);
  }

  async getAccountNumber(address: string, height?: number): Promise<number> {
    const rpcResponse = await this.client.abciQuery({
      path: `auth/accounts/${address}`,
      data: new Uint8Array(),
      height: height ? height : 0,
      prove: false,
    });

    const abciResponse: ABCIResponse = adaptAbciQueryResponse(rpcResponse);
    return extractAccountNumberFromResponse(
      abciResponse.response.ResponseBase.Data,
    );
  }

  async getAccount(address: string, height?: number): Promise<ABCIAccount> {
    const rpcResponse = await this.client.abciQuery({
      path: `auth/accounts/${address}`,
      data: new Uint8Array(),
      height: height ? height : 0,
      prove: false,
    });

    const abciResponse: ABCIResponse = adaptAbciQueryResponse(rpcResponse);
    return extractAccountFromResponse(abciResponse.response.ResponseBase.Data);
  }

  async getStatus(): Promise<Status> {
    const rpcResponse = await this.client.status();
    return adaptStatusResponse(rpcResponse);
  }

  async getTransaction(hash: string): Promise<TxResult> {
    const hashBytes = Uint8Array.from(
      (hash.match(/.{1,2}/g) ?? []).map(byte => parseInt(byte, 16)),
    );
    const rpcResponse = await this.client.tx({
      hash: hashBytes,
    });
    return adaptTxResponse(rpcResponse);
  }

  async sendTransaction<K extends keyof BroadcastTransactionMap>(
    tx: string,
    endpoint: K,
  ): Promise<BroadcastTransactionMap[K]["result"]> {
    const txBytes = Uint8Array.from(Buffer.from(tx, "base64"));

    switch (endpoint) {
      case TransactionEndpoint.BROADCAST_TX_COMMIT:
        return this.broadcastTxCommit(txBytes);
      case TransactionEndpoint.BROADCAST_TX_SYNC:
      default:
        return this.broadcastTxSync(txBytes);
    }
  }

  private async broadcastTxSync(
    txBytes: Uint8Array,
  ): Promise<BroadcastTxSyncResult> {
    const rpcResponse = await this.client.broadcastTxSync({
      tx: txBytes,
    });
    const response = adaptBroadcastTxSyncResponse(rpcResponse);

    if (response.error) {
      const errType: string = response.error[ABCIErrorKey];
      const log: string = response.Log;

      throw constructRequestError(errType, log);
    }

    return response;
  }

  private async broadcastTxCommit(
    txBytes: Uint8Array,
  ): Promise<BroadcastTxCommitResult> {
    const rpcResponse = await this.client.broadcastTxCommit({
      tx: txBytes,
    });
    const response = adaptBroadcastTxCommitResponse(rpcResponse);

    const {
      check_tx, deliver_tx,
    } = response;

    if (check_tx.ResponseBase.Error) {
      const errType: string = check_tx.ResponseBase.Error[ABCIErrorKey];
      const log: string = check_tx.ResponseBase.Log;

      throw constructRequestError(errType, log);
    }

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
    timeout?: number,
  ): Promise<Tx> {
    return waitForTransaction(this, hash, fromHeight, timeout);
  }
}
