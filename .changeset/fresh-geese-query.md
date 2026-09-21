---
"@gnolang/tm2-js-client": minor
---

Implement `Provider.getGasPrice` for any valid TM2 fee denomination. It returns the `{ amount, denom, gas }` gas price (or `null` when the node has no minimum gas price configured) instead of dropping the denomination. ABCI gas price query errors and their node logs are now propagated instead of returning fallback values or parsing errors.
