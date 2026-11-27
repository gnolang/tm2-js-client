import {
  describe,
  expect,
  test,
} from "vitest";

import {
  accountWithMultisigPubkey,
  accountWithoutPubkey,
  accountWithPubkey,
  damagedAccounts,
  uninitializedAccount,
} from "../../../tests/fixtures/accounts.js";
import {
  AccountDecodeError,
  AccountNotInitializedError,
} from "../../index.js";
import {
  extractAccountFromResponse,
  extractAccountNumberFromResponse,
  extractSequenceFromResponse,
} from "./provider.utility.js";
import {
  stringToBase64,
} from "./requests.utility.js";

describe.each([extractAccountFromResponse, extractAccountNumberFromResponse])("%s", (extract) => {
  test.each([null, "", stringToBase64(uninitializedAccount)])("identifies an uninitialized account %#", (data) => {
    expect(() => extract(data)).toThrow(AccountNotInitializedError);
    expect(() => extract(data)).toThrow("account is not initialized");
  });
});

describe.each([extractAccountFromResponse, extractAccountNumberFromResponse, extractSequenceFromResponse])("%s", (extract) => {
  test.each(damagedAccounts)("preserves the decode failure cause %#", (data) => {
    expect(() => extract(stringToBase64(data))).toThrow(AccountDecodeError);
    expect(() => extract(stringToBase64(data))).toThrow(expect.objectContaining({
      cause: expect.any(Error),
    }));
  });
});

test.each([null, "", stringToBase64(uninitializedAccount)])("returns sequence 0 for an uninitialized account %#", (data) => {
  expect(extractSequenceFromResponse(data)).toBe(0);
});

test.each([accountWithoutPubkey, accountWithPubkey, accountWithMultisigPubkey])("extracts an initialized account %#", (data) => {
  expect(extractAccountFromResponse(stringToBase64(data))).toStrictEqual(JSON.parse(data));
  expect(extractAccountNumberFromResponse(stringToBase64(data))).toBe(7);
  expect(extractSequenceFromResponse(stringToBase64(data))).toBe(3);
});
