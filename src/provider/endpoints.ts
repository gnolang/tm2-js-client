export enum CommonEndpoint {
  HEALTH = 'health',
  STATUS = 'status',
}

export enum ConsensusEndpoint {
  NET_INFO = 'net_info',
  GENESIS = 'genesis',
  CONSENSUS_PARAMS = 'consensus_params',
  CONSENSUS_STATE = 'consensus_state',
  COMMIT = 'commit',
  VALIDATORS = 'validators',
}

export enum BlockEndpoint {
  BLOCK = 'block',
  BLOCK_RESULTS = 'block_results',
  BLOCKCHAIN = 'blockchain',
}

export enum TransactionEndpoint {
  NUM_UNCONFIRMED_TXS = 'num_unconfirmed_txs',
  UNCONFIRMED_TXS = 'unconfirmed_txs',
  BROADCAST_TX_ASYNC = 'broadcast_tx_async',
  BROADCAST_TX_SYNC = 'broadcast_tx_sync',
  BROADCAST_TX_COMMIT = 'broadcast_tx_commit',
}

export enum ABCIEndpoint {
  ABCI_INFO = 'abci_info',
  ABCI_QUERY = 'abci_query',
}
