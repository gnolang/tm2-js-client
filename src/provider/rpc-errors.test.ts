import {
  afterEach, beforeEach, describe, expect, test, vi,
} from "vitest";

import * as errors from "../index.js";
import {
  JSONRPCProvider,
} from "./jsonrpc/jsonrpc.js";
import {
  WSProvider,
} from "./websocket/ws.js";

test("does not export the internal RPC error converter", () => {
  expect(errors).not.toHaveProperty("convertRPCError");
});

test("RPC errors are not TM2 errors", () => {
  expect(new errors.RPCRequestError("m", -32603, "Internal error")).not.toBeInstanceOf(errors.TM2Error);
  expect(new errors.CodeExecutionRefusedError("m", -32603, "Internal error")).toBeInstanceOf(errors.RPCRequestError);
});

const {
  mockClient,
} = vi.hoisted(() => ({
  mockClient: {
    abciQuery: vi.fn(),
    tx: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock("@gnolang/tm2-rpc", () => ({
  Tm2Client: {
    connect: vi.fn().mockResolvedValue(mockClient),
  },
}));

const refusal = (path: string) => `403: query "${path}" runs code, which this node does not allow over RPC (rpc.allow_code_execution = false)`;

describe.each([["JSON-RPC", () => JSONRPCProvider.create("http://localhost:26657")], ["WS", () => WSProvider.create("ws://localhost:26657")]] as const)("%s provider RPC errors", (_name, createProvider) => {
  let provider: JSONRPCProvider | WSProvider;

  beforeEach(async () => {
    vi.clearAllMocks();
    provider = await createProvider();
  });

  afterEach(() => {
    if (provider instanceof WSProvider) provider.closeConnection();
  });

  test.each([
    ["estimateGas", refusal(".app/simulate"), (p: JSONRPCProvider | WSProvider) => p.estimateGas(errors.Tx.create())],
    ...["vm/qeval", "vm/qeval_json", "vm/qrender"].map(path => [
      `abciQuery ${path}`,
      refusal(path),
      (p: JSONRPCProvider | WSProvider) => p.abciQuery({
        path,
      }),
    ] as const),
    [
      "a reworded refusal",
      "RPC code execution is disabled by rpc.allow_code_execution",
      (p: JSONRPCProvider | WSProvider) => p.abciQuery({
        path: "vm/qeval",
      }),
    ],
  ] as const)("%s rejects with CodeExecutionRefusedError", async (_label, data, call) => {
    const response = {
      code: -32603,
      message: "Internal error",
      data,
    };
    const message = JSON.stringify(response);
    mockClient.abciQuery.mockRejectedValueOnce(new Error(message));

    const error = await call(provider).catch(error => error);

    expect(error.constructor).toBe(errors.CodeExecutionRefusedError);
    expect(error).toMatchObject({
      code: response.code,
      rpcMessage: response.message,
      data: response.data,
      message,
    });
  });

  test.each([
    {
      code: -32603,
      message: "Internal error",
      data: "tx (ABCD) not found",
    },
    {
      code: -32601,
      message: "Method not found",
    },
  ])("keeps the fields and original message of a generic JSON-RPC error: %o", async (response) => {
    const message = JSON.stringify(response);
    mockClient.tx.mockRejectedValueOnce(new Error(message));

    const error = await provider.getTransaction("ABCD").catch(error => error);

    expect(error.constructor).toBe(errors.RPCRequestError);
    expect(error).toMatchObject({
      code: response.code,
      rpcMessage: response.message,
      message,
    });
    expect(error.data).toBe(response.data);
  });

  test.each([
    new Error("Bad status on response: 502"),
    new Error("network failure"),
    new Error("null"),
    new Error("[]"),
    new Error("42"),
    new Error("{\"code\":\"-32603\",\"message\":\"Internal error\"}"),
    new Error("{\"code\":-32603,\"message\":null}"),
    {
      code: -32603,
      message: "Internal error",
    },
    "network failure",
    null,
  ])("rethrows non-JSON-RPC failures unchanged: %s", async (error) => {
    mockClient.tx.mockRejectedValueOnce(error);

    await expect(provider.getTransaction("ABCD")).rejects.toBe(error);
  });
});
