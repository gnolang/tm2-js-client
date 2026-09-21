---
"@gnolang/tm2-js-client": patch
---

Update dependencies: `@gnolang/tm2-rpc` 2.0.2, `@cosmjs/*` 0.39.0, `@bufbuild/protobuf` 2.15.0, `@noble/hashes` 2.4.0, axios 1.20.0, protobufjs 8.8.0 and uuid 14.0.2, along with the build and test toolchain.

The public API is unchanged. tsdown 0.23 writes the bundled type declarations with inline `export` modifiers instead of a trailing `export { ... }` block; the exported names are identical and `attw` reports no problems.
