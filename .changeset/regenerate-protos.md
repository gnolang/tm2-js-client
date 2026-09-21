---
"@gnolang/tm2-js-client": patch
---

Regenerate the protobuf sources with ts-proto 2.12.4, the version the lockfile already resolved; they had been generated with 2.11.6.

Every generated `decode()` now guards its recursion depth, throwing `protobuf decode recursion limit exceeded` once a message nests more than 100 levels instead of recursing until the stack overflows. The message types, and encoding and decoding of any realistic payload, are unchanged.
