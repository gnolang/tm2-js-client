import {
  Tm2Client,
} from "@gnolang/tm2-rpc";

import {
  Tx,
} from "../proto/index.js";
import {
  TransactionEndpoint,
} from "./endpoints.js";
import {
  ABCIAccount,
  ABCIErrorKey,
  ABCIResponse,
  BlockInfo,
  BlockResult,
  BroadcastAsGeneric,
  BroadcastTransactionMap,
  BroadcastTxCommitResult,
  BroadcastTxSyncResult,
  ConsensusParams,
  NetworkInfo,
  Status,
  TxResult,
} from "./types/index.js";
import {
  constructRequestError,
} from "./utility/errors.utility.js";
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
} from "./utility/index.js";

/**
 * Read-only abstraction for accessing blockchain data
 */
export interface Provider {
  // Account-specific methods //

  /**
   * Fetches the denomination balance of the account
   * @param {string} address the bech32 address of the account
   * @param {string} [denomination=ugnot] the balance denomination
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used
   */
  getBalance(
    address: string,
    denomination?: string,
    height?: number
  ): Promise<number>

  /**
   * Fetches the account sequence
   * @param {string} address the bech32 address of the account
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used.
   * @deprecated use {@link getAccount} instead
   */
  getAccountSequence(address: string, height?: number): Promise<number>

  /**
   * Fetches the account number. Errors out if the account
   * is not initialized
   * @param {string} address the bech32 address of the account
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used
   * @deprecated use {@link getAccount} instead
   */
  getAccountNumber(address: string, height?: number): Promise<number>

  /**
   * Fetches the account. Errors out if the account
   * is not initialized
   * @param {string} address the bech32 address of the account
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used
   */
  getAccount(address: string, height?: number): Promise<ABCIAccount>

  /**
   * Fetches the block at the specific height, if any
   * @param {number} height the height for querying
   */
  getBlock(height: number): Promise<BlockInfo>

  /**
   * Fetches the block at the specific height, if any
   * @param {number} height the height for querying
   */
  getBlockResult(height: number): Promise<BlockResult>

  /**
   * Fetches the latest block number from the chain
   */
  getBlockNumber(): Promise<number>

  // Network-specific methods //

  /**
   * Fetches the network information
   */
  getNetwork(): Promise<NetworkInfo>

  /**
   * Fetches the consensus params for the specific block height
   * @param {number} height the height for querying
   */
  getConsensusParams(height: number): Promise<ConsensusParams>

  /**
   * Fetches the current node status
   */
  getStatus(): Promise<Status>

  /**
   * Fetches the current (recommended) average gas price
   */
  getGasPrice(): Promise<number>

  /**
   * Estimates the gas limit for the transaction
   * @param {Tx} tx the transaction that needs estimating
   */
  estimateGas(tx: Tx): Promise<bigint>

  // Transaction specific methods //

  /**
   * Sends the transaction to the node. If the type of endpoint
   * is a broadcast commit, waits for the transaction to be committed to the chain.
   * The transaction needs to be signed beforehand.
   * Returns the transaction broadcast result.
   * @param {string} tx the base64-encoded signed transaction
   * @param {BroadcastType} endpoint the transaction broadcast type (sync / commit)
   */
  sendTransaction<K extends keyof BroadcastTransactionMap>(
    tx: string,
    endpoint: K
  ): Promise<BroadcastAsGeneric<K>["result"]>

  /**
   * Waits for the transaction to be committed on the chain.
   * NOTE: This method will not take in the fromHeight parameter once
   * proper transaction indexing is added - the implementation should
   * simply try to fetch the transaction first to see if it's included in a block
   * before starting to wait for it; Until then, this method should be used
   * in the sequence:
   * get latest block -> send transaction -> waitForTransaction(block before send)
   * @param {string} hash The transaction hash
   * @param {number} [fromHeight=latest] The block height used to begin the search
   * @param {number} [timeout=15000] Optional wait timeout in MS
   */
  waitForTransaction(
    hash: string,
    fromHeight?: number,
    timeout?: number
  ): Promise<Tx>
}

/**
 * Base provider implementation backed by a Tm2Client.
 * Subclasses only need to provide a static `create()` factory.
 */
export abstract class BaseTm2Provider implements Provider {
  protected readonly client: Tm2Client;

  protected constructor(client: Tm2Client) {
    this.client = client;
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

    const resultErrorKey = simulateResult.response_base?.error?.type_url;
    if (resultErrorKey) {
      throw constructRequestError(resultErrorKey);
    }

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
