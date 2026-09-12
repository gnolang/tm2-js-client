---
"@gnolang/tm2-js-client": major
---

Render the signature payload fee in the shape the Ledger Cosmos app accepts (`{"amount":[{"amount","denom"}],"gas"}`), matching gnolang/gno#6173. This changes the signed bytes for every signer; nodes without gnolang/gno#6173 reject transactions signed by this version. `gas_fee` is now parsed with the same rules as `std.ParseCoin` on the chain.
