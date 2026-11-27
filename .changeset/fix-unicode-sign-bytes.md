---
"@gnolang/tm2-js-client": patch
---

Fix transaction signatures containing U+2028 or U+2029 and reject lone surrogates in signing payloads before signing.
