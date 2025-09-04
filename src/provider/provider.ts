import {
  ABCIAccount,
  BlockInfo,
  BlockResult,
  BroadcastAsGeneric,
  BroadcastTransactionMap,
  ConsensusParams,
  NetworkInfo,
  Status,
} from './types';
import { Tx } from '../proto';

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
  ): Promise<number>;

  /**
   * Fetches the account sequence
   * @param {string} address the bech32 address of the account
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used.
   * @deprecated use {@link getAccount} instead
   */
  getAccountSequence(address: string, height?: number): Promise<number>;

  /**
   * Fetches the account number. Errors out if the account
   * is not initialized
   * @param {string} address the bech32 address of the account
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used
   * @deprecated use {@link getAccount} instead
   */
  getAccountNumber(address: string, height?: number): Promise<number>;

  /**
   * Fetches the account. Errors out if the account
   * is not initialized
   * @param {string} address the bech32 address of the account
   * @param {number} [height=0] the height for querying.
   * If omitted, the latest height is used
   */
  getAccount(address: string, height?: number): Promise<ABCIAccount>;

  /**
   * Fetches the block at the specific height, if any
   * @param {number} height the height for querying
   */
  getBlock(height: number): Promise<BlockInfo>;

  /**
   * Fetches the block at the specific height, if any
   * @param {number} height the height for querying
   */
  getBlockResult(height: number): Promise<BlockResult>;

  /**
   * Fetches the latest block number from the chain
   */
  getBlockNumber(): Promise<number>;

  // Network-specific methods //

  /**
   * Fetches the network information
   */
  getNetwork(): Promise<NetworkInfo>;

  /**
   * Fetches the consensus params for the specific block height
   * @param {number} height the height for querying
   */
  getConsensusParams(height: number): Promise<ConsensusParams>;

  /**
   * Fetches the current node status
   */
  getStatus(): Promise<Status>;

  /**
   * Fetches the current (recommended) average gas price
   */
  getGasPrice(): Promise<number>;

  /**
   * Estimates the gas limit for the transaction
   * @param {Tx} tx the transaction that needs estimating
   */
  estimateGas(tx: Tx): Promise<number>;

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
  ): Promise<BroadcastAsGeneric<K>['result']>;

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
  ): Promise<Tx>;
}
