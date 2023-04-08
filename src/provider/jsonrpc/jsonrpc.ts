import { Provider } from '../provider';
import { ConsensusParams, Network, Status } from '../types';

/**
 * Provider based on JSON-RPC HTTP requests
 */
export class JSONRPCProvider implements Provider {
  // TODO

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

  getBlockNumber(): Promise<number> {
    return Promise.reject('implement me');
  }

  getBlockWithTransactions(height: number): Promise<any> {
    return Promise.reject('implement me');
  }

  getConsensusParams(height: number): Promise<ConsensusParams> {
    return Promise.reject('implement me');
  }

  getGasPrice(): Promise<number> {
    return Promise.reject('implement me');
  }

  getNetwork(): Promise<Network> {
    return Promise.reject('implement me');
  }

  getSequence(address: string, height?: number): Promise<number> {
    return Promise.reject('implement me');
  }

  getStatus(): Promise<Status> {
    return Promise.reject('implement me');
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
