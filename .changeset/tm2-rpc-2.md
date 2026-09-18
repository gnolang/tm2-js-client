---
"@gnolang/tm2-js-client": minor
---

Update `@gnolang/tm2-rpc` to 2.x.

This fixes validator address decoding, which throws `RangeError: limit: expected safe integer, got Infinity` for anyone whose install resolves `@scure/base` to 2.3.0 or later — currently every fresh install. It affects `status`, `validators`, `genesis` and `dumpConsensusState`.

It also picks up tm2-rpc 2.x's decoding fixes: `broadcastTxSync` and `broadcastTxAsync` no longer throw while decoding the node's response, and `blockResults` and `tx` no longer throw on transactions that emit events without a `pkg_path`, such as the `/bank.TransferEvent` emitted for every ugnot transfer.

The types this package exposes are unchanged. ABCI errors are still surfaced as a string map, now including any string fields the concrete error type carries beyond `@type`.
