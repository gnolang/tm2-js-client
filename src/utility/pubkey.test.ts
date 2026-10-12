import {
  describe, expect, test,
} from "vitest";

import {
  Any,
} from "../proto/google/protobuf/any.js";
import {
  PubKeyMultisig,
} from "../proto/tm2/multisig.js";
import {
  PubKeySecp256k1,
} from "../proto/tm2/tx.js";
import {
  pubKeyToAminoJSON, txSignatureToAminoJSON,
} from "./pubkey.js";

// Signer of gnoland-1 tx 4D19D55B8F60E77EB088999F14CD82DEFFED53A686B851046F35106E3293FD5A
const wrappedKey = "CiEDj1rKTtK1tGBXlnzB7slX8zV08lbfuJ7gUEQNLwNEuKk=";
const rawKey = "A49ayk7StbRgV5Z8we7JV/M1dPJW37ie4FBEDS8DRLip";

const secpAny = (key: string): Any => ({
  type_url: "/tm.PubKeySecp256k1",
  value: PubKeySecp256k1.encode({
    key: Uint8Array.from(atob(key), c => c.charCodeAt(0)),
  }).finish(),
});

const multisigAny = (k: bigint, pubKeys: Any[]): Any => ({
  type_url: "/tm.PubKeyMultisig",
  value: PubKeyMultisig.encode({
    k,
    pub_keys: pubKeys,
  }).finish(),
});

describe("pubKeyToAminoJSON", () => {
  test("unwraps a secp256k1 key", () => {
    const pubKey = secpAny(rawKey);
    expect(btoa(String.fromCharCode(...pubKey.value))).toBe(wrappedKey);

    expect(pubKeyToAminoJSON(pubKey)).toEqual({
      "@type": "/tm.PubKeySecp256k1",
      value: rawKey,
    });
  });

  test("converts a nested multisig key", () => {
    const inner = multisigAny(1n, [secpAny(rawKey)]);

    expect(pubKeyToAminoJSON(multisigAny(2n, [secpAny(rawKey), inner])))
      .toEqual({
        "@type": "/tm.PubKeyMultisig",
        threshold: "2",
        pubkeys: [
          {
            "@type": "/tm.PubKeySecp256k1",
            value: rawKey,
          },
          {
            "@type": "/tm.PubKeyMultisig",
            threshold: "1",
            pubkeys: [
              {
                "@type": "/tm.PubKeySecp256k1",
                value: rawKey,
              },
            ],
          },
        ],
      });
  });

  test("unwraps an ed25519 key", () => {
    // Ed25519 keys share the secp256k1 wire layout: field 1, length prefixed bytes.
    const key = new Uint8Array(32).fill(7);

    expect(pubKeyToAminoJSON({
      type_url: "/tm.PubKeyEd25519",
      value: PubKeySecp256k1.encode({
        key,
      }).finish(),
    })).toEqual({
      "@type": "/tm.PubKeyEd25519",
      value: btoa(String.fromCharCode(...key)),
    });
  });

  test("keeps the raw value of an unknown type", () => {
    expect(pubKeyToAminoJSON({
      type_url: "/tm.PubKeyUnknown",
      value: new Uint8Array([1, 2, 3]),
    })).toEqual({
      "@type": "/tm.PubKeyUnknown",
      value: "AQID",
    });
  });
});

describe("txSignatureToAminoJSON", () => {
  test("converts the key and omits an empty session address", () => {
    expect(txSignatureToAminoJSON({
      pub_key: secpAny(rawKey),
      signature: new Uint8Array([1, 2, 3]),
      session_addr: "",
    })).toStrictEqual({
      pub_key: {
        "@type": "/tm.PubKeySecp256k1",
        value: rawKey,
      },
      signature: "AQID",
    });
  });

  test("returns null for a missing key and keeps the session address", () => {
    const session = "g18dd5mstjqlcg9ngqpg26azeya6wqg7upd9t8xa";

    expect(txSignatureToAminoJSON({
      pub_key: undefined,
      signature: new Uint8Array(0),
      session_addr: session,
    })).toStrictEqual({
      pub_key: null,
      signature: "",
      session_addr: session,
    });
  });
});
