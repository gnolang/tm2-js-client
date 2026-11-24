---
"@gnolang/tm2-js-client": major
---

Generate std ABCI error classes from upstream. Breaking changes:

- Std messages now follow upstream `Error()` strings: "unable to decode tx" → "tx decode error", "insufficient funds" → "insufficient funds error", and "signature is unauthorized" → "unauthorized error".
- Eight newly mapped std errors (restricted transfer, query timeout, four session errors, and two vesting errors) now return dedicated classes instead of the generic `TM2Error` fallback.
- JSON-RPC failures now reject with `RPCRequestError` or `CodeExecutionRefusedError`, instead of a plain `Error`. They extend `Error`, not `TM2Error`, and keep the original message.
