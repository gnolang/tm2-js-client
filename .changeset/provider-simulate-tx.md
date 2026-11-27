---
"@gnolang/tm2-js-client": minor
---

Add `simulateTx` to `Provider` and `Wallet`, returning the full simulated `ResponseDeliverTx` (gas and emitted events). `estimateGas` now wraps it. Custom `Provider` implementations must add the method; `BaseTm2Provider` subclasses inherit it.
