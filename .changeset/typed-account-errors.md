---
"@gnolang/tm2-js-client": major
---

Export AccountNotInitializedError and AccountDecodeError to distinguish missing accounts (including null node responses) from malformed account data, preserving the decode cause and the existing uninitialized-account message.

Breaking changes:

- `getAccountSequence` now rejects with `AccountDecodeError` instead of returning 0 when account decoding fails. Uninitialized accounts still return 0.
- Account queries now reject with `AccountDecodeError` when `BaseAccount` is not an object or its `account_number` or `sequence` is not a decimal digit string.
