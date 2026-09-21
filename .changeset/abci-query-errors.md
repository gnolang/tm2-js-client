---
"@gnolang/tm2-js-client": minor
---

Propagate ABCI query errors and their node logs instead of returning fallback values or parsing errors. This covers balance and account queries, gas price queries, and preserves simulation error logs.
