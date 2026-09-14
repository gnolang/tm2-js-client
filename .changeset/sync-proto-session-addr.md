---
"@gnolang/tm2-js-client": minor
---

Sync `tm2/tx.proto` with upstream `std.Signature`: add the `session_addr` field (introduced by gno account sessions) to `TxSignature`, and regenerate the protobuf bindings. Master-key signatures keep an empty `session_addr`, so the wire encoding is unchanged for existing transactions.
