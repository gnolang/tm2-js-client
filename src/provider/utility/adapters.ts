import type {
  AbciQueryResponse,
  BlockResponse,
  BlockResultsResponse,
  BroadcastTxCommitResponse,
  BroadcastTxSyncResponse,
  ConsensusParamsResponse as RpcConsensusParamsResponse,
  NetInfoResponse,
  ResponseBase,
  StatusResponse,
  TxData,
  TxResponse,
  TxResult as RpcTxResult,
} from "@gnolang/tm2-rpc";

import type {
  ABCIResponse,
  ABCIResponseBase,
  BeginBlock,
  BlockInfo,
  BlockResult,
  BroadcastTxCommitResult,
  BroadcastTxSyncResult,
  ConsensusParams,
  DeliverTx,
  EndBlock,
  NetworkInfo,
  Status,
  TxResult,
} from "../types/index.js";

export const toHexString = (data: Uint8Array): string => {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

export const toBase64 = (data: Uint8Array): string => {
  return Buffer.from(data).toString("base64");
};

const adaptResponseBase = (rb: ResponseBase): ABCIResponseBase => {
  return {
    Error: rb.error?.["@type"]
      ? {
        "@type": rb.error["@type"],
        value: rb.error.value,
      }
      : null,
    Data: rb.data.length > 0 ? toBase64(rb.data) : null,
    Events: rb.events.length > 0 ? JSON.stringify(rb.events) : null,
    Log: rb.log,
    Info: rb.info,
  };
};

const adaptTxData = (td: TxData): DeliverTx => {
  return {
    ResponseBase: adaptResponseBase(td.responseBase),
    GasWanted: String(td.gasWanted),
    GasUsed: String(td.gasUsed),
  };
};

export const adaptStatusResponse = (r: StatusResponse): Status => {
  return {
    node_info: {
      version_set: r.nodeInfo.versionSet.map(v => ({
        Name: v.name,
        Version: v.version,
        Optional: v.optional,
      })),
      net_address: r.nodeInfo.listenAddr,
      network: r.nodeInfo.network,
      software: r.nodeInfo.software,
      version: r.nodeInfo.version,
      channels: r.nodeInfo.channels.map(c => String(c)).join(""),
      monkier: r.nodeInfo.moniker,
      other: {
        tx_index: "",
        rpc_address: "",
      },
    },
    sync_info: {
      latest_block_hash: toHexString(r.syncInfo.latestBlockHash),
      latest_app_hash: toHexString(r.syncInfo.latestAppHash),
      latest_block_height: String(r.syncInfo.latestBlockHeight),
      latest_block_time: r.syncInfo.latestBlockTime.toISOString(),
      catching_up: r.syncInfo.catchingUp,
    },
    validator_info: {
      address: toHexString(r.validatorInfo.address),
      pub_key: {
        type: r.validatorInfo.pubkey?.algorithm ?? "",
        value: toBase64(r.validatorInfo.pubkey?.data ?? new Uint8Array()),
      },
      voting_power: String(r.validatorInfo.votingPower),
    },
  };
};

const adaptBlockId = (
  bid: {
    hash: Uint8Array
    parts: {
      total: bigint
      hash: Uint8Array
    }
  } | null,
) => {
  if (!bid) {
    return {
      hash: null,
      parts: {
        total: "0",
        hash: null,
      },
    };
  }
  return {
    hash: bid.hash.length > 0 ? toHexString(bid.hash) : null,
    parts: {
      total: String(bid.parts.total),
      hash: bid.parts.hash.length > 0 ? toHexString(bid.parts.hash) : null,
    },
  };
};

const adaptHeader = (h: BlockResponse["block"]["header"]) => {
  return {
    version: h.version,
    chain_id: h.chainId,
    height: String(h.height),
    time: h.time.toISOString(),
    num_txs: String(h.numTxs),
    total_txs: String(h.totalTxs),
    app_version: h.appVersion,
    last_block_id: adaptBlockId(h.lastBlockId),
    last_commit_hash:
      h.lastCommitHash.length > 0 ? toHexString(h.lastCommitHash) : null,
    data_hash: h.dataHash.length > 0 ? toHexString(h.dataHash) : null,
    validators_hash: toHexString(h.validatorsHash),
    consensus_hash: toHexString(h.consensusHash),
    app_hash: toHexString(h.appHash),
    last_results_hash:
      h.lastResultsHash.length > 0 ? toHexString(h.lastResultsHash) : null,
    proposer_address: h.proposerAddress,
  };
};

export const adaptBlockResponse = (r: BlockResponse): BlockInfo => {
  return {
    block_meta: {
      block_id: adaptBlockId(r.blockMeta.blockId),
      header: adaptHeader(r.blockMeta.header),
    },
    block: {
      header: adaptHeader(r.block.header),
      data: {
        txs:
          r.block.txs.length > 0
            ? r.block.txs.map(tx => toBase64(tx))
            : null,
      },
      last_commit: r.block.lastCommit
        ? {
          block_id: adaptBlockId(r.block.lastCommit.blockId),
          precommits: r.block.lastCommit.precommits.length > 0
            ? r.block.lastCommit.precommits.map(p =>
              p
                ? {
                  type: p.type,
                  height: String(p.height),
                  round: String(p.round),
                  block_id: adaptBlockId(p.blockId),
                  timestamp: p.timestamp.toISOString(),
                  validator_address: p.validatorAddress,
                  validator_index: String(p.validatorIndex),
                  signature: toBase64(p.signature),
                }
                : null,
            )
            : null,
        }
        : {
          block_id: {
            hash: null,
            parts: {
              total: "0",
              hash: null,
            },
          },
          precommits: null,
        },
    },
  };
};

const adaptRpcTxResult = (tr: RpcTxResult): DeliverTx => {
  return {
    ResponseBase: adaptResponseBase(tr.responseBase),
    GasWanted: String(tr.gasWanted),
    GasUsed: String(tr.gasUsed),
  };
};

export const adaptBlockResultsResponse = (
  r: BlockResultsResponse,
): BlockResult => {
  return {
    height: String(r.height),
    results: {
      deliver_tx:
        r.results.deliverTx.length > 0
          ? r.results.deliverTx.map(adaptRpcTxResult)
          : null,
      end_block: {
        ResponseBase: adaptResponseBase(r.results.endBlock.responseBase),
        ValidatorUpdates: null,
        ConsensusParams: null,
        Events: null,
      } as EndBlock,
      begin_block: {
        ResponseBase: adaptResponseBase(r.results.beginBlock.responseBase),
      } as BeginBlock,
    },
  };
};

export const adaptNetInfoResponse = (r: NetInfoResponse): NetworkInfo => {
  return {
    listening: r.listening,
    listeners: r.listeners,
    n_peers: String(r.nPeers),
    peers: r.peers.map(p => p.remoteIp),
  };
};

export const adaptConsensusParamsResponse = (
  r: RpcConsensusParamsResponse,
): ConsensusParams => {
  return {
    block_height: String(r.blockHeight),
    consensus_params: {
      Block: {
        MaxTxBytes: String(r.consensusParams.block.maxTxBytes),
        MaxDataBytes: String(r.consensusParams.block.maxDataBytes),
        MaxBlockBytes: String(r.consensusParams.block.maxBlockBytes),
        MaxGas: String(r.consensusParams.block.maxGas),
        TimeIotaMS: String(r.consensusParams.block.timeIotaMs),
      },
      Validator: {
        PubKeyTypeURLs: [...r.consensusParams.validator.pubKeyTypeUrls],
      },
    },
  };
};

export const adaptAbciQueryResponse = (r: AbciQueryResponse): ABCIResponse => {
  return {
    response: {
      ResponseBase: adaptResponseBase(r.responseBase),
      Key: r.key.length > 0 ? toBase64(r.key) : null,
      Value: r.value.length > 0 ? toBase64(r.value) : null,
      Proof: r.proof
        ? {
          ops: r.proof.ops.map(op => ({
            type: op.type,
            key: op.key.length > 0 ? toBase64(op.key) : null,
            data: op.data.length > 0 ? toBase64(op.data) : null,
          })),
        }
        : null,
      Height: r.height != null ? String(r.height) : "0",
    },
  };
};

export const adaptBroadcastTxSyncResponse = (
  r: BroadcastTxSyncResponse,
): BroadcastTxSyncResult => {
  return {
    error: r.responseBase.error?.["@type"]
      ? {
        "@type": r.responseBase.error["@type"],
        value: r.responseBase.error.value,
      }
      : null,
    data: r.responseBase.data.length > 0 ? toBase64(r.responseBase.data) : null,
    Log: r.responseBase.log,
    hash: toHexString(r.hash),
  };
};

export const adaptBroadcastTxCommitResponse = (
  r: BroadcastTxCommitResponse,
): BroadcastTxCommitResult => {
  return {
    check_tx: adaptTxData(r.checkTx),
    deliver_tx: r.deliverTx
      ? adaptTxData(r.deliverTx)
      : {
        ResponseBase: {
          Error: null,
          Data: null,
          Events: null,
          Log: "",
          Info: "",
        },
        GasWanted: "0",
        GasUsed: "0",
      },
    hash: toHexString(r.hash),
    height: String(r.height),
  };
};

export const adaptTxResponse = (r: TxResponse): TxResult => {
  return {
    hash: toHexString(r.hash),
    index: r.index,
    height: String(r.height),
    tx_result: adaptTxData(r.result),
    tx: toBase64(r.tx),
  };
};
