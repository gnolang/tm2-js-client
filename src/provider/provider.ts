import { ConsensusParams, NetworkInfo, Status } from './types';

/**
 * Read-only abstraction for accessing blockchain data
 */
export interface Provider {
  // Account-specific methods //

  /**
   * Fetches the denomination balance of the account
   * @param {string} address The bech32 address of the account
   * @param {string} [denomination="ugnot"] The balance denomination
   * @param {number} [height=0] The height for querying.
   * If omitted, the latest height is used
   */
  getBalance(
    address: string,
    denomination?: string,
    height?: number
  ): Promise<number>;

  /**
   * Fetches the account sequence
   * @param {string} address The bech32 address of the account
   * @param {number} [height=0] The height for querying.
   * If omitted, the latest height is used.
   */
  getSequence(address: string, height?: number): Promise<number>;

  /**
   * Fetches the block at the specific height, if any
   * @param {number} height The height for querying
   */
  getBlock(height: number): Promise<any>; // TODO define type

  /**
   * Fetches the latest block number from the chain
   */
  getBlockNumber(): Promise<number>; // TODO define type

  /**
   * Fetches the block at the specific height, with transactions
   * @param {number} height The height for querying
   */
  getBlockWithTransactions(height: number): Promise<any>; // TODO define type

  // Network-specific methods //

  /**
   * Fetches the network information
   */
  getNetwork(): Promise<NetworkInfo>;

  /**
   * Fetches the consensus params for the specific block height
   * @param {number} height The height for querying
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
   * @param {any} tx The transaction that needs estimating
   */
  estimateGas(tx: any): Promise<number>; // TODO define type

  // Transaction specific methods //

  /**
   * Sends the transaction to the node for committing.
   * The transaction needs to be signed beforehand.
   * @param {any} tx The signed transaction
   */
  sendTransaction(tx: any): Promise<any>; // TODO define type

  /**
   * Fetches the transaction using the transaction hash.
   * Returns null if transaction has not been committed.
   * @param {any} hash The hash of the transaction
   */
  getTransaction(hash: any): Promise<any>; // TODO define type

  /**
   * Fetches transaction commit information, if any.
   * Returns null if the transaction has not been committed yet
   * @param {any} hash The hash of the transaction
   */
  getTransactionCommit(hash: any): Promise<any>; // TODO define type

  /**
   * Waits for the transaction to be committed on the chain
   * @param {any} hash The transaction hash
   * @param {number} [timeout=15000] Optional wait timeout in MS
   */
  waitForTransaction(hash: any, timeout?: number): Promise<any>; // TODO define type
}
