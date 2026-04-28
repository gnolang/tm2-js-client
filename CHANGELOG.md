# Changelog

All notable changes to `@gnolang/tm2-js-client` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file was reconstructed from git history and npm release metadata. Each release links to the commit that the corresponding npm version was published from. Releases prior to this changelog were not previously tagged in git; tags `v1.0.0`–`v2.0.4` were created retroactively to point at those commits.

## Compatibility with `@gnolang/gno-js-client`

`@gnolang/gno-js-client` depends on `@gnolang/tm2-js-client`. The table below lists each `gno-js-client` release's declared `tm2-js-client` floor (caret range, so the latest compatible minor of `tm2-js-client` is also fine):

| `gno-js-client` | `tm2-js-client` floor |
| --------------- | --------------------- |
| 2.0.2           | `^2.0.4`              |
| 2.0.0 – 2.0.1   | `^2.0.2` – `^2.0.3`   |
| 1.4.5           | `^1.3.3`              |
| 1.4.1 – 1.4.4   | `^1.3.0` – `^1.3.3`   |
| 1.4.0           | `^1.3.0`              |
| 1.3.2           | `^1.2.4`              |
| 1.3.0 – 1.3.1   | `^1.2.1` – `^1.2.2`   |
| 1.2.0 – 1.2.3   | `^1.1.6` – `^1.2.0`   |
| 1.1.x           | `^1.1.x` (tracks closely; e.g. `gno 1.1.7` ⇒ `tm2 ^1.1.5`) |
| 1.0.x           | `^1.0.x` (`gno 1.0.6+` ⇒ `tm2 ^1.0.6`) |

When in doubt, prefer the latest `gno-js-client` whose declared `tm2-js-client` floor is at or below the version you're pinning. Crossing a `tm2-js-client` major (e.g. mixing `gno-js-client@1.x` with `tm2-js-client@2.x`) is not supported.

---

## [2.0.4] – 2026-04-01

[Compare 2.0.3...2.0.4](https://github.com/gnolang/tm2-js-client/compare/v2.0.3...v2.0.4) · commit [`84ccd38`](https://github.com/gnolang/tm2-js-client/commit/84ccd38c98d8738cc02c02f04eb99347a109f793)

### Fixed
- Proto exports were missing from the published bundle ([#260](https://github.com/gnolang/tm2-js-client/pull/260)).

## [2.0.3] – 2026-04-01

[Compare 2.0.2...2.0.3](https://github.com/gnolang/tm2-js-client/compare/v2.0.2...v2.0.3) · commit [`872d297`](https://github.com/gnolang/tm2-js-client/commit/872d297)

### Fixed
- Disabled tree-shaking in the bundler — multisig exports were being dropped from the published build ([#260](https://github.com/gnolang/tm2-js-client/pull/260)).

## [2.0.2] – 2026-03-31

[Compare 2.0.1...2.0.2](https://github.com/gnolang/tm2-js-client/compare/v2.0.1...v2.0.2) · commit [`39d4716`](https://github.com/gnolang/tm2-js-client/commit/39d471679d952de10379bbb573a231348f80303f)

### Changed
- Bumped `@gnolang/tm2-rpc` to `v1.0.0` ([#259](https://github.com/gnolang/tm2-js-client/pull/259)).
- Refactored tests; moved CBA helper methods out of the auto-generated proto files.

## [2.0.1] – 2026-03-31

commit [`dd7a3e5`](https://github.com/gnolang/tm2-js-client/commit/dd7a3e5) (off-main; published from the `chore/bump-tm2-rpc` branch before squash-merge)

### Changed
- Initial bump of `@gnolang/tm2-rpc` to `v1.0.0`. This was published off-branch; main was squash-merged at `2.0.2` (see [#259](https://github.com/gnolang/tm2-js-client/pull/259)). If you can, prefer `2.0.2` — it includes the same change plus a test refactor.

## [2.0.0] – 2026-03-30

[Compare 1.3.3...2.0.0](https://github.com/gnolang/tm2-js-client/compare/v1.3.3...v2.0.0) · commit [`4499e74`](https://github.com/gnolang/tm2-js-client/commit/4499e74176abd7befd8d8c37cfdd26e8db30aec3)

The 2.0 line is a major rewrite of the project's tooling and runtime expectations. See **Migration: 1.x → 2.0** below.

### ⚠️ Breaking Changes
- **Proto numbers are `bigint`, not `Long`.** Fields previously typed `Long` (e.g. `gas_wanted`, `gas_used`, sequences, heights) are now `bigint`. Any code that constructed or read `Long` values (`Long.fromNumber`, `.toNumber()`, `.toString()`, `.eq()`, …) needs to switch to `bigint` (`BigInt(x)`, `Number(x)`, arithmetic with the `n` suffix). This is a wire-compatible change but a source-incompatible one.
- **RPC layer moved to `@gnolang/tm2-rpc`.** The internal JSON-RPC / WebSocket transport was extracted to a new package ([allinbits/tm2-rpc](https://github.com/allinbits/tm2-rpc)). Direct importers of the previous `provider/spec` types may need to update import paths.
- **Tested on Node.js 24.** No `engines` field is enforced, but the test/build matrix moved to Node 24 and earlier majors are no longer covered.

### Added
- Dual ESM + CJS distribution. The package now ships as `"type": "module"` with conditional `exports` — `import` resolves to `dist/index.mjs`, `require` resolves to `dist/index.cjs`, with matching `.d.mts` / `.d.cts` types. Both consumer styles continue to work.

### Changed
- Build pipeline migrated to **tsdown**.
- Test framework migrated from **jest** to **vitest**.
- Package manager switched from **yarn** to **pnpm**.
- Linting setup modernised; rules unified with sibling JS/TS projects.
- All runtime and dev dependencies updated to current majors.

### Pre-2.0 dependency bumps included
- `@types/node` 24.3.0 → 24.5.2 ([#241](https://github.com/gnolang/tm2-js-client/pull/241))
- `prettier` 3.6.2 → 3.7.3 ([#246](https://github.com/gnolang/tm2-js-client/pull/246)), 3.7.3 → 3.8.1 ([#250](https://github.com/gnolang/tm2-js-client/pull/250))
- eslint group bumps ([#242](https://github.com/gnolang/tm2-js-client/pull/242), [#251](https://github.com/gnolang/tm2-js-client/pull/251))
- actions group bump ([#247](https://github.com/gnolang/tm2-js-client/pull/247))
- `feat: Version 2.0` ([#256](https://github.com/gnolang/tm2-js-client/pull/256))

### Migration: 1.x → 2.0

1. **Replace `Long` with `bigint`.** Search your codebase for any `Long` usage that came from this package's proto types and convert:
   - `Long.fromNumber(x)` → `BigInt(x)`
   - `value.toNumber()` → `Number(value)`
   - `value.toString()` → `value.toString()` *(unchanged)*
   - `a.add(b)` / `a.eq(b)` → `a + b` / `a === b`
2. **Move to a Node 24+ runtime** for both build and test. CI/build images pinned to older Node majors should be updated.
3. **Pair with `@gnolang/gno-js-client` `2.0.x`** if you use it (older `gno-js-client` versions depend on `tm2-js-client` 1.x and will not work with 2.x).
4. No source changes are required for ESM vs CJS consumers — both paths are still supported via the new conditional `exports`.
5. No migration is required for `Provider` / `Wallet` / `Signer` public API shapes — those are preserved.

---

## [1.3.3] – 2025-09-08

[Compare 1.3.2...1.3.3](https://github.com/gnolang/tm2-js-client/compare/v1.3.2...v1.3.3) · commit [`9937dbf`](https://github.com/gnolang/tm2-js-client/commit/9937dbf7e7a2369099870d65b2df515db3c8a3a3)

### Added
- **Multisig support** ([#235](https://github.com/gnolang/tm2-js-client/pull/235)).

### Fixed
- `status` call now correctly forwards the `heightGte` parameter ([#232](https://github.com/gnolang/tm2-js-client/pull/232)).

### Changed
- eslint group bump ([#233](https://github.com/gnolang/tm2-js-client/pull/233)).

## [1.3.2] – 2025-09-04

commit [`45cb8d2`](https://github.com/gnolang/tm2-js-client/commit/45cb8d238991b03d7dc3fc01cc6aa461208d4a0d)

### Added
- `Provider.getAccount()` method ([#231](https://github.com/gnolang/tm2-js-client/pull/231)).

## [1.3.1] – 2025-08-27

commit [`dcc065c`](https://github.com/gnolang/tm2-js-client/commit/dcc065cbfa512f111a5d0eaccd26e2026c13fb53)

### Changed
- `actions/checkout` 4 → 5 ([#229](https://github.com/gnolang/tm2-js-client/pull/229)).
- `everything-else` group bump (12 packages) ([#230](https://github.com/gnolang/tm2-js-client/pull/230)).

## [1.3.0] – 2025-07-16

commit [`ff60d66`](https://github.com/gnolang/tm2-js-client/commit/ff60d662594a89068ccf1d2482ea92d718fc4b4d)

### ⚠️ Breaking Changes
- **Proto field naming changed from camelCase to snake_case.** `Any.typeUrl` → `Any.type_url`, `ResponseDeliverTx.gasWanted/gasUsed` → `gas_wanted/gas_used`, `Tx.responseBase` → `response_base`, etc. Any code that read/wrote those fields directly must be updated. This change aligns the TS proto types with the on-the-wire field names.

### Changed
- Regenerated proto bindings to use snake_case field names (`scripts/generate.sh` updated accordingly).

## [1.2.7] – 2025-07-16

commit [`d3f6c52`](https://github.com/gnolang/tm2-js-client/commit/d3f6c52beac3f6dbb3f141d904267ddd1009245f)

### Changed
- Regenerated proto bindings (intermediate state; superseded by 1.3.0's snake_case rename — recommend skipping straight to 1.3.0).

## [1.2.6] – 2025-07-16

commit [`bd7e0f5`](https://github.com/gnolang/tm2-js-client/commit/bd7e0f5f04d1cc65153edabd217dccc5a0c21dc1)

### Changed
- `package.json` housekeeping. No source changes.

## [1.2.5] – 2025-07-16

commit [`6edd900`](https://github.com/gnolang/tm2-js-client/commit/6edd900dbd91f80f104d208a8b44698dd62f0bd8)

### Changed
- `everything-else` group bump (16 packages) ([#200](https://github.com/gnolang/tm2-js-client/pull/200)).
- `everything-else` group bump (24 packages) ([#224](https://github.com/gnolang/tm2-js-client/pull/224)).

## [1.2.4] – 2025-01-16

commit [`66d3056`](https://github.com/gnolang/tm2-js-client/commit/66d30564dc218c9df7204501edc46df3088a86ef)

### Added
- `Wallet.fromSigner()` static method ([#199](https://github.com/gnolang/tm2-js-client/pull/199)).

## [1.2.3] – 2025-01-13

commit [`2d5afd2`](https://github.com/gnolang/tm2-js-client/commit/2d5afd2c6c9420ec8251e50a7497217debf331fa)

### Added
- `Provider.estimateGas()` method ([#192](https://github.com/gnolang/tm2-js-client/pull/192)).

### Changed
- `everything-else` group bump (3 packages) ([#182](https://github.com/gnolang/tm2-js-client/pull/182)).

## [1.2.2] – 2024-09-19

commit [`23a65fb`](https://github.com/gnolang/tm2-js-client/commit/23a65fb8d31fb69cf377c5d7b09519234cc66986)

### Added
- `Provider.getTransaction()` method ([#176](https://github.com/gnolang/tm2-js-client/pull/176)).

### Changed
- `everything-else` group bumps ([#171](https://github.com/gnolang/tm2-js-client/pull/171), [#179](https://github.com/gnolang/tm2-js-client/pull/179)).

## [1.2.1] – 2024-06-26

commit [`0559605`](https://github.com/gnolang/tm2-js-client/commit/0559605233f44e16ae913b579ca7b8cdf0da412b)

### Changed
- Updated `cosmjs` dependency.
- README updates ([#149](https://github.com/gnolang/tm2-js-client/pull/149)).

## [1.2.0] – 2024-04-29

commit [`8555258`](https://github.com/gnolang/tm2-js-client/commit/8555258)

### ⚠️ Breaking Changes
- **`time` field removed from the transaction signature payload** ([#144](https://github.com/gnolang/tm2-js-client/pull/144)). Signatures produced by 1.2.0+ will not verify on chains/relays that still expect the old payload, and vice versa. Coordinate any signer/verifier upgrades together.

### Changed
- `ts-proto` 1.171.0 → 1.172.0 ([#143](https://github.com/gnolang/tm2-js-client/pull/143)).

## [1.1.7] – 2024-04-06

commit [`504c43d`](https://github.com/gnolang/tm2-js-client/commit/504c43d6885c7973514601b7116645da443d8334)

### Added
- `Signer` interface is now exported ([#130](https://github.com/gnolang/tm2-js-client/pull/130)).

### Changed
- actions group bump ([#138](https://github.com/gnolang/tm2-js-client/pull/138)).
- `everything-else` group bump (6 packages) ([#141](https://github.com/gnolang/tm2-js-client/pull/141)).
- `@types/node` 20.11.1 → 20.12.5 ([#140](https://github.com/gnolang/tm2-js-client/pull/140)).

## [1.1.6] – 2024-02-12

commit [`299b8a3`](https://github.com/gnolang/tm2-js-client/commit/299b8a3c3ac1bb581449b21206c65ad61e6b737b)

### Added
- Escape characters are now properly encoded when generating transactions ([#129](https://github.com/gnolang/tm2-js-client/pull/129)).

### Changed
- Dependency bumps: `eslint-plugin-prettier` ([#123](https://github.com/gnolang/tm2-js-client/pull/123)), `@types/node` ([#126](https://github.com/gnolang/tm2-js-client/pull/126)), `prettier` ([#125](https://github.com/gnolang/tm2-js-client/pull/125)), `ts-proto` ([#127](https://github.com/gnolang/tm2-js-client/pull/127), [#128](https://github.com/gnolang/tm2-js-client/pull/128)), `eslint` ([#122](https://github.com/gnolang/tm2-js-client/pull/122)).

## [1.1.5] – 2023-12-04

commit [`9f82891`](https://github.com/gnolang/tm2-js-client/commit/9f82891d74229044c40f0fc71edddd60189e36d4)

### Changed
- Dependency bumps: `semver` ([#83](https://github.com/gnolang/tm2-js-client/pull/83)), `axios` ([#110](https://github.com/gnolang/tm2-js-client/pull/110)), `typescript` ([#115](https://github.com/gnolang/tm2-js-client/pull/115)), `@types/node` ([#118](https://github.com/gnolang/tm2-js-client/pull/118)), `ts-proto` ([#121](https://github.com/gnolang/tm2-js-client/pull/121)), `eslint-config-prettier` ([#120](https://github.com/gnolang/tm2-js-client/pull/120)), `eslint` ([#119](https://github.com/gnolang/tm2-js-client/pull/119)), `@cosmjs/amino` 0.31.0 → 0.32.0 ([#116](https://github.com/gnolang/tm2-js-client/pull/116)), `@cosmjs/crypto` 0.31.0 → 0.32.0 ([#112](https://github.com/gnolang/tm2-js-client/pull/112)), `prettier` 3.0.0 → 3.1.0 ([#106](https://github.com/gnolang/tm2-js-client/pull/106)).

## [1.1.4] – 2023-09-25

commit [`c198d1a`](https://github.com/gnolang/tm2-js-client/commit/c198d1a39690b30f4948b5829bd80536e885988b)

### Changed
- Switched JSON-RPC request IDs to UUIDs ([#88](https://github.com/gnolang/tm2-js-client/pull/88)). Mirrors the WS provider change in 1.1.3 for the JSON-RPC provider.

## [1.1.3] – 2023-09-24

commit [`906c995`](https://github.com/gnolang/tm2-js-client/commit/906c99543946aba23a7949773ccd01d756d9f767)

### Changed
- WebSocket provider: request IDs are now UUIDs (was numeric counter); WS connection timeout increased ([#85](https://github.com/gnolang/tm2-js-client/pull/85)).

## [1.1.2] – 2023-09-22

commit [`3a30b5f`](https://github.com/gnolang/tm2-js-client/commit/3a30b5f816ff7111aec876461b4be849ff8225aa)

### Fixed
- Correctly reference `ABCIErrorKey` ([#84](https://github.com/gnolang/tm2-js-client/pull/84)).

## [1.1.1] – 2023-09-21

commit [`579b69d`](https://github.com/gnolang/tm2-js-client/commit/579b69d09fd04a55616c4137ccf61d9216aa9f7d)

### Changed
- Previously private `Wallet` fields are now exported (allows subclassing / external utilities).

## [1.1.0] – 2023-09-13

commit [`87de815`](https://github.com/gnolang/tm2-js-client/commit/87de8156b451a4da034eefce551af58c39683d8c)

### ⚠️ Breaking Changes
- **`Wallet.sendTransaction()` return type changed.** It now returns the broadcast result rather than the raw hash; callers that destructured or relied on the previous shape need to update. See [#78](https://github.com/gnolang/tm2-js-client/pull/78).

### Changed
- Dependency bumps: `jest-websocket-mock` ([#82](https://github.com/gnolang/tm2-js-client/pull/82)), `eslint` ([#81](https://github.com/gnolang/tm2-js-client/pull/81)), `@types/node` ([#80](https://github.com/gnolang/tm2-js-client/pull/80)), `ws` 8.13.0 → 8.14.1 ([#79](https://github.com/gnolang/tm2-js-client/pull/79)).

## [1.0.6] – 2023-09-06

commit [`a0ea2ab`](https://github.com/gnolang/tm2-js-client/commit/a0ea2ab353c1d2f59b068811401ab3ba89fb8d3d)

### Added
- `Wallet` API now supports custom `sendTransaction` endpoints (e.g. `/broadcast_tx_commit` vs `/broadcast_tx_sync`).

## [1.0.5] – 2023-09-06

commit [`cf2928b`](https://github.com/gnolang/tm2-js-client/commit/cf2928bb18d2cad6ffd5f983c766e6656a90bf7c)

### Added
- `sendTransaction` now surfaces broadcast errors instead of swallowing them ([#59](https://github.com/gnolang/tm2-js-client/pull/59)).

### Changed
- Dependency bumps: `prettier` 2.x → 3.0 ([#55](https://github.com/gnolang/tm2-js-client/pull/55)), `ts-proto` ([#69](https://github.com/gnolang/tm2-js-client/pull/69)), `jest` ([#58](https://github.com/gnolang/tm2-js-client/pull/58)), `eslint`/`eslint-config-prettier` ([#68](https://github.com/gnolang/tm2-js-client/pull/68), [#70](https://github.com/gnolang/tm2-js-client/pull/70), [#71](https://github.com/gnolang/tm2-js-client/pull/71), [#72](https://github.com/gnolang/tm2-js-client/pull/72), [#75](https://github.com/gnolang/tm2-js-client/pull/75)), `typescript` 5.1 → 5.2 ([#76](https://github.com/gnolang/tm2-js-client/pull/76)), `@typescript-eslint/*` ([#60](https://github.com/gnolang/tm2-js-client/pull/60), [#62](https://github.com/gnolang/tm2-js-client/pull/62)), `@types/node` ([#67](https://github.com/gnolang/tm2-js-client/pull/67), [#73](https://github.com/gnolang/tm2-js-client/pull/73)), `axios` 1.4 → 1.5 ([#74](https://github.com/gnolang/tm2-js-client/pull/74)), `ts-proto` ([#77](https://github.com/gnolang/tm2-js-client/pull/77)).

## [1.0.4] – 2023-07-03

commit [`b05acbb`](https://github.com/gnolang/tm2-js-client/commit/b05acbb70a443314da43b2f26318e85d232069a0)

### Changed
- Bumped `@cosmjs/*` dependencies.

## [1.0.3] – 2023-07-03

commit [`7a41adf`](https://github.com/gnolang/tm2-js-client/commit/7a41adfd6da2257912875e8100e993f126ebf614)

### Fixed
- Account fetch ABCI query response parsing ([#44](https://github.com/gnolang/tm2-js-client/pull/44)).

### Changed
- Dependency bumps: `eslint`, `ts-proto`, `typescript`, `@types/node`, `@typescript-eslint/*`, `ts-jest`, `protobufjs` ([#33](https://github.com/gnolang/tm2-js-client/pull/33), [#34](https://github.com/gnolang/tm2-js-client/pull/34), [#41](https://github.com/gnolang/tm2-js-client/pull/41), [#43](https://github.com/gnolang/tm2-js-client/pull/43), [#45](https://github.com/gnolang/tm2-js-client/pull/45), [#47](https://github.com/gnolang/tm2-js-client/pull/47), [#48](https://github.com/gnolang/tm2-js-client/pull/48), [#49](https://github.com/gnolang/tm2-js-client/pull/49), [#50](https://github.com/gnolang/tm2-js-client/pull/50), [#51](https://github.com/gnolang/tm2-js-client/pull/51), [#52](https://github.com/gnolang/tm2-js-client/pull/52)).

## [1.0.2] – 2023-06-16

commit [`e5d2918`](https://github.com/gnolang/tm2-js-client/commit/e5d2918bc4a219c80118161aa8df485f3873c3c7)

### Fixed
- ABCI query against the WebSocket provider when fetching balances ([#32](https://github.com/gnolang/tm2-js-client/pull/32)).

### Changed
- Dependency bumps: `@types/node`, `@types/ws`, `@typescript-eslint/parser` ([#29](https://github.com/gnolang/tm2-js-client/pull/29), [#30](https://github.com/gnolang/tm2-js-client/pull/30), [#31](https://github.com/gnolang/tm2-js-client/pull/31)).

## [1.0.1] – 2023-06-08

commit [`b12c390`](https://github.com/gnolang/tm2-js-client/commit/b12c390fe3d71e7eb87ccce16f98223b35186fcc)

### Changed
- Dependency bumps: `@types/node`, `ts-proto`, `eslint`, `@typescript-eslint/*`, `@types/jest`, `typescript` ([#21](https://github.com/gnolang/tm2-js-client/pull/21), [#23](https://github.com/gnolang/tm2-js-client/pull/23), [#24](https://github.com/gnolang/tm2-js-client/pull/24), [#25](https://github.com/gnolang/tm2-js-client/pull/25), [#26](https://github.com/gnolang/tm2-js-client/pull/26), [#27](https://github.com/gnolang/tm2-js-client/pull/27), [#28](https://github.com/gnolang/tm2-js-client/pull/28)).

## [1.0.0] – 2023-05-16

commit [`40f01db`](https://github.com/gnolang/tm2-js-client/commit/40f01db) (head of `main` at the time of the `1.0.0` npm publish)

Initial public release.

### Added
- `Provider` abstraction with JSON-RPC and WebSocket implementations.
- `Signer` abstraction with `Key` (raw Secp256k1) and `Ledger` implementations.
- `Wallet` API for account-scoped interaction with TM2 chains.
- Core proto types for TM2 (`tx`, `abci`, `google.protobuf.Any`).
- Balance/account/status query methods.
- `Wallet.getPrivateKey()` accessor for the key signer ([#2](https://github.com/gnolang/tm2-js-client/pull/2)).
- Configurable address prefix on `Wallet` creation ([#3](https://github.com/gnolang/tm2-js-client/pull/3)).
- Balance-fetch response handling fix in initial proto wiring ([#1](https://github.com/gnolang/tm2-js-client/pull/1)).

[2.0.4]: https://github.com/gnolang/tm2-js-client/releases/tag/v2.0.4
[2.0.3]: https://github.com/gnolang/tm2-js-client/releases/tag/v2.0.3
[2.0.2]: https://github.com/gnolang/tm2-js-client/releases/tag/v2.0.2
[2.0.1]: https://github.com/gnolang/tm2-js-client/releases/tag/v2.0.1
[2.0.0]: https://github.com/gnolang/tm2-js-client/releases/tag/v2.0.0
[1.3.3]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.3.3
[1.3.2]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.3.2
[1.3.1]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.3.1
[1.3.0]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.3.0
[1.2.7]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.7
[1.2.6]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.6
[1.2.5]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.5
[1.2.4]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.4
[1.2.3]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.3
[1.2.2]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.2
[1.2.1]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.1
[1.2.0]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.2.0
[1.1.7]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.7
[1.1.6]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.6
[1.1.5]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.5
[1.1.4]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.4
[1.1.3]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.3
[1.1.2]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.2
[1.1.1]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.1
[1.1.0]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.1.0
[1.0.6]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.6
[1.0.5]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.5
[1.0.4]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.4
[1.0.3]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.3
[1.0.2]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.2
[1.0.1]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.1
[1.0.0]: https://github.com/gnolang/tm2-js-client/releases/tag/v1.0.0
