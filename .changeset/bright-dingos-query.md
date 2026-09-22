---
"@gnolang/tm2-js-client": minor
---

Expose `Provider.abciQuery` so callers can issue arbitrary application queries through JSON-RPC and WebSocket providers. Successful responses retain their data and metadata, while ABCI errors continue to reject with the mapped error type and node log.
