---
"@gnolang/tm2-js-client": patch
---

`estimateGas` sends the transaction's bytes to `.app/simulate` once. It sent their base64 text as the bytes, which `abciQuery` base64-encoded again, so nodes answered `unable to decode tx` for every simulation.
