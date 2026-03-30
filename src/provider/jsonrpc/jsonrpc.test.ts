import {
  sha256,
} from "@cosmjs/crypto";
import type {
  AbciQueryResponse,
  BlockResponse,
  BlockResultsResponse,
  BroadcastTxSyncResponse,
  ConsensusParamsResponse as RpcConsensusParamsResponse,
  NetInfoResponse as RpcNetInfoResponse,
  ResponseBase,
  StatusResponse,
} from "@gnolang/tm2-rpc";
import {
  WritableDeep,
} from "type-fest";
import {
  beforeEach, describe, expect, test, vi,
} from "vitest";

import {
  Tx,
} from "../../proto/index.js";
import {
  TransactionEndpoint,
} from "../endpoints.js";
import {
  TM2Error,
} from "../errors/index.js";
import {
  UnauthorizedErrorMessage,
} from "../errors/messages.js";
import {
  ABCIAccount,
  BroadcastTxSyncResult,
  ConsensusParams,
  NetworkInfo,
  Status,
} from "../types/index.js";
import {
  stringToBase64, uint8ArrayToBase64,
} from "../utility/index.js";
import {
  JSONRPCProvider,
} from "./jsonrpc.js";

// Helper to create an empty ResponseBase
const emptyResponseBase = (overrides?: Partial<ResponseBase>): ResponseBase => ({
  error: {
    "@type": "",
    value: "",
  },
  data: new Uint8Array(),
  events: [],
  log: "",
  info: "",
  ...overrides,
});

// Mock Tm2Client - use vi.hoisted so it's available in the hoisted vi.mock factory
const {
  mockClient,
} = vi.hoisted(() => {
  const mockClient = {
    abciQuery: vi.fn(),
    block: vi.fn(),
    blockResults: vi.fn(),
    broadcastTxSync: vi.fn(),
    broadcastTxCommit: vi.fn(),
    status: vi.fn(),
    netInfo: vi.fn(),
    consensusParams: vi.fn(),
    tx: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    mockClient,
  };
});

vi.mock("@gnolang/tm2-rpc", () => ({
  Tm2Client: {
    connect: vi.fn().mockResolvedValue(mockClient),
  },
}));

const mockURL = "http://127.0.0.1:26657";

describe("JSON-RPC Provider", () => {
  let provider: JSONRPCProvider;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = await JSONRPCProvider.create(mockURL);
  });

  test("estimateGas", async () => {
    const tx = Tx.fromJSON({
      signatures: [],
      fee: {
        gasFee: "",
        gasWanted: 0n,
      },
      messages: [],
      memo: "",
    });
    const expectedEstimation = 44900n;

    const mockAbciResponse: AbciQueryResponse = {
      responseBase: emptyResponseBase(),
      key: new Uint8Array(),
      value: Buffer.from(
        "CiMiIW1zZzowLHN1Y2Nlc3M6dHJ1ZSxsb2c6LGV2ZW50czpbXRCAiXoYyL0F",
        "base64",
      ),
      height: 0,
    };

    vi.mocked(mockClient.abciQuery).mockResolvedValue(mockAbciResponse);

    const estimation = await provider.estimateGas(tx);

    expect(mockClient.abciQuery).toHaveBeenCalled();
    expect(estimation).toEqual(expectedEstimation);
  });

  test("getNetwork", async () => {
    const mockRpcInfo: RpcNetInfoResponse = {
      listening: false,
      listeners: [],
      nPeers: 0,
      peers: [],
    };

    vi.mocked(mockClient.netInfo).mockResolvedValue(mockRpcInfo);

    const info: NetworkInfo = await provider.getNetwork();

    expect(mockClient.netInfo).toHaveBeenCalled();
    expect(info.listening).toBe(false);
    expect(info.n_peers).toBe("0");
  });

  test("getBlock", async () => {
    const mockRpcBlock: BlockResponse = {
      blockMeta: {
        blockId: {
          hash: new Uint8Array(),
          parts: {
            total: 0n,
            hash: new Uint8Array(),
          },
        },
        header: {
          version: "1",
          chainId: "test",
          height: 1,
          time: new Date("2023-01-01T00:00:00Z"),
          numTxs: 0n,
          totalTxs: 0n,
          appVersion: "1",
          lastBlockId: null,
          lastCommitHash: new Uint8Array(),
          dataHash: new Uint8Array(),
          validatorsHash: new Uint8Array(),
          consensusHash: new Uint8Array(),
          appHash: new Uint8Array(),
          lastResultsHash: new Uint8Array(),
          proposerAddress: "",
          nextValidatorsHash: new Uint8Array(),
        },
      },
      block: {
        header: {
          version: "1",
          chainId: "test",
          height: 1,
          time: new Date("2023-01-01T00:00:00Z"),
          numTxs: 0n,
          totalTxs: 0n,
          appVersion: "1",
          lastBlockId: null,
          lastCommitHash: new Uint8Array(),
          dataHash: new Uint8Array(),
          validatorsHash: new Uint8Array(),
          consensusHash: new Uint8Array(),
          appHash: new Uint8Array(),
          lastResultsHash: new Uint8Array(),
          proposerAddress: "",
          nextValidatorsHash: new Uint8Array(),
        },
        txs: [],
        lastCommit: null,
        evidence: [],
      },
    };

    vi.mocked(mockClient.block).mockResolvedValue(mockRpcBlock);

    const info = await provider.getBlock(1);

    expect(mockClient.block).toHaveBeenCalledWith(1);
    expect(info.block.header.height).toBe("1");
  });

  test("getBlockResult", async () => {
    const mockRpcResult: BlockResultsResponse = {
      height: 1,
      results: {
        deliverTx: [],
        beginBlock: {
          responseBase: emptyResponseBase(),
        },
        endBlock: {
          responseBase: emptyResponseBase(),
          validatorUpdates: null,
          consensusParams: null,
          events: null,
        },
      },
    };

    vi.mocked(mockClient.blockResults).mockResolvedValue(mockRpcResult);

    const result = await provider.getBlockResult(1);

    expect(mockClient.blockResults).toHaveBeenCalledWith(1);
    expect(result.height).toBe("1");
  });

  describe("sendTransaction", () => {
    const mockError = "/std.UnauthorizedError";
    const mockLog = "random error message";

    test("broadcastTxSync - success", async () => {
      const mockRpcResponse: BroadcastTxSyncResponse = {
        hash: new Uint8Array([0x68, 0x61, 0x73, 0x68]),
        responseBase: emptyResponseBase(),
        gasWanted: 0n,
        gasUsed: 0n,
      };

      vi.mocked(mockClient.broadcastTxSync).mockResolvedValue(mockRpcResponse);

      const result: BroadcastTxSyncResult = await provider.sendTransaction(
        "encoded tx",
        TransactionEndpoint.BROADCAST_TX_SYNC,
      );

      expect(mockClient.broadcastTxSync).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    test("broadcastTxSync - error", async () => {
      const mockRpcResponse: BroadcastTxSyncResponse = {
        hash: new Uint8Array(),
        responseBase: emptyResponseBase({
          error: {
            "@type": mockError,
            value: "",
          },
          log: mockLog,
        }),
        gasWanted: 0n,
        gasUsed: 0n,
      };

      vi.mocked(mockClient.broadcastTxSync).mockResolvedValue(mockRpcResponse);

      try {
        await provider.sendTransaction(
          "encoded tx",
          TransactionEndpoint.BROADCAST_TX_SYNC,
        );
        throw new Error("expected error");
      }
      catch (e) {
        expect((e as Error).message).toBe(UnauthorizedErrorMessage);
        expect((e as TM2Error).log).toBe(mockLog);
      }
    });
  });

  test("waitForTransaction", async () => {
    const tx: Tx = {
      messages: [],
      signatures: [],
      memo: "tx memo",
    };

    const encodedTx = Tx.encode(tx).finish();
    const txHash = sha256(encodedTx);

    const latestBlock = 5;
    const startBlock = latestBlock - 2;

    // Mock status
    const mockStatusResponse: StatusResponse = {
      nodeInfo: {
        listenAddr: "",
        network: "",
        version: "",
        software: "",
        channels: [],
        moniker: "",
        other: new Map(),
        versionSet: [],
      },
      syncInfo: {
        latestBlockHash: new Uint8Array(),
        latestAppHash: new Uint8Array(),
        latestBlockHeight: latestBlock,
        latestBlockTime: new Date(),
        catchingUp: false,
      },
      validatorInfo: {
        address: new Uint8Array(),
        votingPower: 0n,
      },
    };

    vi.mocked(mockClient.status).mockResolvedValue(mockStatusResponse);

    // Mock block responses
    const makeEmptyBlock = (height: number): WritableDeep<BlockResponse> => ({
      blockMeta: {
        blockId: {
          hash: new Uint8Array(),
          parts: {
            total: 0n,
            hash: new Uint8Array(),
          },
        },
        header: {
          version: "",
          chainId: "",
          height,
          time: new Date(),
          numTxs: 0n,
          totalTxs: 0n,
          appVersion: "",
          lastBlockId: null,
          lastCommitHash: new Uint8Array(),
          dataHash: new Uint8Array(),
          validatorsHash: new Uint8Array(),
          consensusHash: new Uint8Array(),
          appHash: new Uint8Array(),
          lastResultsHash: new Uint8Array(),
          proposerAddress: "",
          nextValidatorsHash: new Uint8Array(),
        },
      },
      block: {
        header: {
          version: "",
          chainId: "",
          height,
          time: new Date(),
          numTxs: 0n,
          totalTxs: 0n,
          appVersion: "",
          lastBlockId: null,
          lastCommitHash: new Uint8Array(),
          dataHash: new Uint8Array(),
          validatorsHash: new Uint8Array(),
          consensusHash: new Uint8Array(),
          appHash: new Uint8Array(),
          lastResultsHash: new Uint8Array(),
          proposerAddress: "",
          nextValidatorsHash: new Uint8Array(),
        },
        txs: [],
        lastCommit: null,
        evidence: [],
      },
    });

    const filledBlock = makeEmptyBlock(latestBlock);
    // Override txs with the encoded tx
    filledBlock.block.txs = [encodedTx];

    vi.mocked(mockClient.block).mockImplementation(async (height?: number) => {
      if (height === latestBlock) return filledBlock;
      return makeEmptyBlock(height ?? 0);
    });

    const receivedTx = await provider.waitForTransaction(
      uint8ArrayToBase64(txHash),
      startBlock,
    );

    expect(mockClient.status).toHaveBeenCalled();
    expect(receivedTx).toEqual(tx);
  });

  test("getConsensusParams", async () => {
    const mockRpcResponse: RpcConsensusParamsResponse = {
      blockHeight: 1,
      consensusParams: {
        block: {
          maxTxBytes: 1000,
          maxDataBytes: 2000,
          maxBlockBytes: 3000,
          maxGas: 4000,
          timeIotaMs: 100,
        },
        validator: {
          pubKeyTypeUrls: [],
        },
      },
    };

    vi.mocked(mockClient.consensusParams).mockResolvedValue(mockRpcResponse);

    const params: ConsensusParams = await provider.getConsensusParams(1);

    expect(mockClient.consensusParams).toHaveBeenCalledWith(1);
    expect(params.block_height).toBe("1");
  });

  test("getStatus", async () => {
    const mockRpcResponse: StatusResponse = {
      nodeInfo: {
        listenAddr: "",
        network: "",
        version: "",
        software: "",
        channels: [],
        moniker: "",
        other: new Map(),
        versionSet: [],
      },
      syncInfo: {
        latestBlockHash: new Uint8Array(),
        latestAppHash: new Uint8Array(),
        latestBlockHeight: 10,
        latestBlockTime: new Date(),
        catchingUp: false,
      },
      validatorInfo: {
        address: new Uint8Array([0x01, 0x02]),
        votingPower: 0n,
      },
    };

    vi.mocked(mockClient.status).mockResolvedValue(mockRpcResponse);

    const status: Status = await provider.getStatus();

    expect(mockClient.status).toHaveBeenCalled();
    expect(status.validator_info.address).toBe("0102");
  });

  test("getBlockNumber", async () => {
    const expectedBlockNumber = 10;
    const mockRpcResponse: StatusResponse = {
      nodeInfo: {
        listenAddr: "",
        network: "",
        version: "",
        software: "",
        channels: [],
        moniker: "",
        other: new Map(),
        versionSet: [],
      },
      syncInfo: {
        latestBlockHash: new Uint8Array(),
        latestAppHash: new Uint8Array(),
        latestBlockHeight: expectedBlockNumber,
        latestBlockTime: new Date(),
        catchingUp: false,
      },
      validatorInfo: {
        address: new Uint8Array(),
        votingPower: 0n,
      },
    };

    vi.mocked(mockClient.status).mockResolvedValue(mockRpcResponse);

    const blockNumber = await provider.getBlockNumber();

    expect(mockClient.status).toHaveBeenCalled();
    expect(blockNumber).toEqual(expectedBlockNumber);
  });

  describe("getBalance", () => {
    const denomination = "atom";
    test.each([["\"5gnot,100atom\"", 100], ["\"5universe\"", 0], ["\"\"", 0]])("case %#", async (existing, expected) => {
      const dataBytes = Buffer.from(stringToBase64(existing), "base64");

      const mockRpcResponse: AbciQueryResponse = {
        responseBase: emptyResponseBase({
          data: dataBytes,
        }),
        key: new Uint8Array(),
        value: new Uint8Array(),
        height: 0,
      };

      vi.mocked(mockClient.abciQuery).mockResolvedValue(mockRpcResponse);

      const balance = await provider.getBalance("address", denomination);

      expect(mockClient.abciQuery).toHaveBeenCalled();
      expect(balance).toBe(expected);
    });
  });

  describe("getSequence", () => {
    const validAccount: ABCIAccount = {
      BaseAccount: {
        address: "random address",
        coins: "",
        public_key: null,
        account_number: "0",
        sequence: "10",
      },
    };

    test.each([[JSON.stringify(validAccount), parseInt(validAccount.BaseAccount.sequence, 10)], ["null", 0]])("case %#", async (response, expected) => {
      const dataBytes = Buffer.from(stringToBase64(response), "base64");

      const mockRpcResponse: AbciQueryResponse = {
        responseBase: emptyResponseBase({
          data: dataBytes,
        }),
        key: new Uint8Array(),
        value: new Uint8Array(),
        height: 0,
      };

      vi.mocked(mockClient.abciQuery).mockResolvedValue(mockRpcResponse);

      const sequence = await provider.getAccountSequence("address");

      expect(mockClient.abciQuery).toHaveBeenCalled();
      expect(sequence).toBe(expected);
    });
  });

  describe("getAccountNumber", () => {
    const validAccount: ABCIAccount = {
      BaseAccount: {
        address: "random address",
        coins: "",
        public_key: null,
        account_number: "10",
        sequence: "0",
      },
    };

    test.each([[JSON.stringify(validAccount), parseInt(validAccount.BaseAccount.account_number, 10)], ["null", 0]])("case %#", async (response, expected) => {
      const dataBytes = Buffer.from(stringToBase64(response), "base64");

      const mockRpcResponse: AbciQueryResponse = {
        responseBase: emptyResponseBase({
          data: dataBytes,
        }),
        key: new Uint8Array(),
        value: new Uint8Array(),
        height: 0,
      };

      vi.mocked(mockClient.abciQuery).mockResolvedValue(mockRpcResponse);

      try {
        const accountNumber = await provider.getAccountNumber("address");

        expect(mockClient.abciQuery).toHaveBeenCalled();
        expect(accountNumber).toBe(expected);
      }
      catch (e) {
        expect((e as Error).message).toContain("account is not initialized");
      }
    });
  });

  describe("getAccount", () => {
    const validAccount: ABCIAccount = {
      BaseAccount: {
        address: "random address",
        coins: "",
        public_key: {
          "@type": "pktype",
          value: "pk",
        },
        account_number: "10",
        sequence: "42",
      },
    };

    test.each([[JSON.stringify(validAccount), validAccount], ["null", null]])("case %#", async (response, expected) => {
      const dataBytes = Buffer.from(
        stringToBase64(response as string),
        "base64",
      );

      const mockRpcResponse: AbciQueryResponse = {
        responseBase: emptyResponseBase({
          data: dataBytes,
        }),
        key: new Uint8Array(),
        value: new Uint8Array(),
        height: 0,
      };

      vi.mocked(mockClient.abciQuery).mockResolvedValue(mockRpcResponse);

      try {
        const account = await provider.getAccount("address");

        expect(mockClient.abciQuery).toHaveBeenCalled();
        expect(account).toStrictEqual(expected);
      }
      catch (e) {
        expect((e as Error).message).toContain("account is not initialized");
      }
    });
  });
});
