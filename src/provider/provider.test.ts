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
    // Type-level guard: this fails `pnpm tsc` unless `getTransaction`
    // is part of the Provider interface. Before the fix it existed only
    // on BaseTm2Provider, so a Provider-typed reference could not call it.
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
