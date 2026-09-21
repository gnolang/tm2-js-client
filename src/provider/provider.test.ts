import {
  describe, expect, it,
} from "vitest";

import {
  JSONRPCProvider,
} from "./jsonrpc/index.js";
import type {
  Provider,
} from "./provider.js";

describe("Provider.getTransaction", () => {
  it("is declared on the Provider interface", () => {
    type HasGetTransaction = Provider["getTransaction"] extends (
      hash: string,
    ) => unknown
      ? true
      : false;

    const ok: HasGetTransaction = true;
    expect(ok).toBe(true);
  });

  it("is implemented on the concrete provider", () => {
    expect(typeof JSONRPCProvider.prototype.getTransaction).toBe("function");
  });
});
