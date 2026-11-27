// tm2 auth handler amino.MarshalJSONIndent output, gno-core cf8ff1267.
export const uninitializedAccount = "null";

export const accountWithoutPubkey = `{
  "BaseAccount": {
    "address": "g16al7zp20sj8uqynqt8tkm85dvgx4fsg7ehxej9",
    "coins": "1000000ugnot",
    "public_key": null,
    "account_number": "7",
    "sequence": "3"
  },
  "attributes": "0"
}`;

export const accountWithPubkey = `{
  "BaseAccount": {
    "address": "g16al7zp20sj8uqynqt8tkm85dvgx4fsg7ehxej9",
    "coins": "1000000ugnot",
    "public_key": {
      "@type": "/tm.PubKeySecp256k1",
      "value": "Ai+hTcTkrHhYmeTIFuTihTCM6z02cbiP9P5m94EMUFth"
    },
    "account_number": "7",
    "sequence": "3"
  },
  "attributes": "0"
}`;

export const accountWithMultisigPubkey = `{
  "BaseAccount": {
    "address": "g1j5jhkcqws94mpywgyh6pyjwtfkv578cunu7j3p",
    "coins": "1000000ugnot",
    "public_key": {
      "@type": "/tm.PubKeyMultisig",
      "threshold": "1",
      "pubkeys": [
        {
          "@type": "/tm.PubKeySecp256k1",
          "value": "Ai+hTcTkrHhYmeTIFuTihTCM6z02cbiP9P5m94EMUFth"
        },
        {
          "@type": "/tm.PubKeySecp256k1",
          "value": "A5BH0MtzGASEfHtTpL8bxBTv3EGSIpDPe4VkiJZpFxzd"
        }
      ]
    },
    "account_number": "7",
    "sequence": "3"
  },
  "attributes": "0"
}`;

// Simulate damaged responses that a node would not normally emit.
export const damagedAccounts = [
  accountWithPubkey.slice(0, accountWithPubkey.indexOf("\"value\"")),
  "{\"BaseAccount\":{}}",
  "{\"BaseAccount\":\"invalid\"}",
  ...["account_number", "sequence"].flatMap(field =>
    ["", "-1", "3\n", 7, null].map(value => JSON.stringify({
      BaseAccount: {
        account_number: "7",
        sequence: "3",
        [field]: value,
      },
    }))),
];
