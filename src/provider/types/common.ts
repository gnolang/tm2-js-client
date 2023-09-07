import { ABCIResponseBase } from './abci';
import { TransactionEndpoint } from '../endpoints';

export interface NetworkInfo {
  // flag indicating if networking is up
  listening: boolean;
  // IDs of the listening peers
  listeners: string[];
  // the number of peers (decimal)
  n_peers: string;
  // the IDs of connected peers
  peers: string[];
}

export interface Status {
  // basic node information
  node_info: NodeInfo;
  // basic sync information
  sync_info: SyncInfo;
  // basic validator information
  validator_info: ValidatorInfo;
}

interface NodeInfo {
  // the version set of the node modules
  version_set: VersionInfo[];
  // validator address @ RPC endpoint
  net_address: string;
  // the chain ID
  network: string;
  software: string;
  // version of the Tendermint node
  version: string;
  channels: string;
  // user machine name
  monkier: string;
  other: {
    // type of enabled tx indexing ("off" when disabled)
    tx_index: string;
    // the TCP address of the node
    rpc_address: string;
  };
}

interface VersionInfo {
  // the name of the module
  Name: string;
  // the version of the module
  Version: string;
  // flag indicating if the module is optional
  Optional: boolean;
}

interface SyncInfo {
  // latest block hash
  latest_block_hash: string;
  // latest application hash
  latest_app_hash: string;
  // latest block height (decimal)
  latest_block_height: string;
  // latest block time in string format (ISO format)
  latest_block_time: string;
  // flag indicating if the node is syncing
  catching_up: boolean;
}

interface ValidatorInfo {
  // the address of the validator node
  address: string;
  // the validator's public key info
  pub_key: PublicKey;
  // the validator's voting power (decimal)
  voting_power: string;
}

interface PublicKey {
  // type of public key
  type: string;
  // public key value
  value: string;
}

export interface ConsensusParams {
  // the current block height
  block_height: string;
  // block consensus params
  consensus_params: {
    // the requested block
    Block: {
      // maximum tx size in bytes
      MaxTxBytes: string;
      // maximum data size in bytes
      MaxDataBytes: string;
      // maximum block size in bytes
      MaxBlockBytes: string;
      // block gas limit
      MaxGas: string;
      // block time in MS
      TimeIotaMS: string;
    };
    // validator info
    Validator: {
      // public key information
      PubKeyTypeURLs: string[];
    };
  };
}

export interface ConsensusState {
  // the current round state
  round_state: {
    // Required because of '/' in response fields (height/round/step)
    [key: string]: string | null | object;
    // the start time of the block
    start_time: string;
    // hash of the proposed block
    proposal_block_hash: string | null;
    // hash of the locked block
    locked_block_hash: string | null;
    // hash of the valid block
    valid_block_hash: string | null;
    // the vote set for the current height
    height_vote_set: object;
  };
}

export interface BlockInfo {
  // block metadata information
  block_meta: BlockMeta;
  // combined block info
  block: Block;
}

export interface BlockMeta {
  // the block parts
  block_id: BlockID;
  // the block header
  header: BlockHeader;
}

export interface Block {
  // the block header
  header: BlockHeader;
  // data contained in the block (txs)
  data: {
    // base64 encoded transactions
    txs: string[] | null;
  };
  // commit information
  last_commit: {
    // the block parts
    block_id: BlockID;
    // validator precommit information
    precommits: PrecommitInfo[] | null;
  };
}

export interface BlockHeader {
  // version of the node
  version: string;
  // the chain ID
  chain_id: string;
  // current height (decimal)
  height: string;
  // block creation time in string format (ISO format)
  time: string;
  // number of transactions (decimal)
  num_txs: string;
  // total number of transactions in the block (decimal)
  total_txs: string;
  // the current app version
  app_version: string;
  // parent block parts
  last_block_id: BlockID;
  // parent block commit hash
  last_commit_hash: string | null;
  // data hash (txs)
  data_hash: string | null;
  // validator set hash
  validators_hash: string;
  // consensus info hash
  consensus_hash: string;
  // app info hash
  app_hash: string;
  // last results hash
  last_results_hash: string | null;
  // address of the proposer
  proposer_address: string;
}

export interface BlockID {
  // the hash of the ID (block)
  hash: string | null;
  // part information
  parts: {
    // total number of parts (decimal)
    total: string;
    // the hash of the part
    hash: string | null;
  };
}

export interface PrecommitInfo {
  // type of precommit
  type: number;
  // the block height for the precommit
  height: string;
  // the round for the precommit
  round: string;
  // the block ID info
  block_id: BlockID;
  // precommit creation time (ISO format)
  timestamp: string;
  // the address of the validator who signed
  validator_address: string;
  // the index of the signer (validator)
  validator_index: string;
  // the base64 encoded signature of the signer (validator)
  signature: string;
}

export interface BlockResult {
  // the block height
  height: string;
  // block result info
  results: {
    // transactions contained in the block
    deliver_tx: DeliverTx[] | null;
    // end-block info
    end_block: EndBlock;
    // begin-block info
    begin_block: BeginBlock;
  };
}

export interface DeliverTx {
  // the transaction ABCI response
  ResponseBase: ABCIResponseBase;
  // transaction gas limit (decimal)
  GasWanted: string;
  // transaction actual gas used (decimal)
  GasUsed: string;
}

export interface EndBlock {
  // the block ABCI response
  ResponseBase: ABCIResponseBase;
  // validator update info
  ValidatorUpdates: string | null;
  // consensus params
  ConsensusParams: string | null;
  // block events
  Events: string | null;
}

export interface BeginBlock {
  // the block ABCI response
  ResponseBase: ABCIResponseBase;
}

export interface BroadcastTxSyncResult {
  error: {
    // ABCIErrorKey
    [key: string]: string;
  } | null;
  data: string | null;
  Log: string;

  hash: string;
}

export interface BroadcastTxCommitResult {
  check_tx: DeliverTx;
  deliver_tx: DeliverTx;
  hash: string;
  height: string; // decimal number
}

export type BroadcastType =
  | TransactionEndpoint.BROADCAST_TX_SYNC
  | TransactionEndpoint.BROADCAST_TX_COMMIT;

export type BroadcastTransactionResult =
  | BroadcastTxSyncResult
  | BroadcastTxCommitResult;
