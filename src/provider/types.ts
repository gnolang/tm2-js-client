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
  // latest block time in string format (YY-MM-DDTHH-mm-ss.Z)
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
  round_state: {
    // Required because of '/' in response fields
    [key: string]: string | null | object;
    start_time: string;
    proposal_block_hash: string | null;
    locked_block_hash: string | null;
    valid_block_hash: string | null;
    height_vote_set: object;
  };
}

export const consensusStateKey = 'height/round/step';
