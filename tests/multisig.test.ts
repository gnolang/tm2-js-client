import {
  bytesToHex,
} from "@noble/hashes/utils.js";
import {
  describe, expect, test,
} from "vitest";

import {
  CompactBitArray,
} from "../src/proto/tm2/multisig.js";
import {
  compactBitArrayFromAmino,
  compactBitArrayToAmino,
} from "../src/utility/compact-bit-array.js";

describe("TestMarshalCompactBitArrayAmino", () => {
  const testCases = [
    {
      marshalledBA: "null",
      hexOutput: "",
    },
    {
      marshalledBA: "null",
      hexOutput: "",
    },
    {
      marshalledBA: "\"_\"",
      hexOutput: "0801120100",
    },
    {
      marshalledBA: "\"x\"",
      hexOutput: "0801120180",
    },
    {
      marshalledBA: "\"xx___\"",
      hexOutput: "08051201c0",
    },
    {
      marshalledBA: "\"xx______x\"",
      hexOutput: "08011202c080",
    },
    {
      marshalledBA: "\"xx_____________x\"",
      hexOutput: "1202c001",
    },
  ];

  test.each(testCases)("$marshalledBA", async ({
    marshalledBA, hexOutput,
  }) => {
    const aminoString: string | null = JSON.parse(marshalledBA);
    const bA = compactBitArrayFromAmino(aminoString);

    const bz = CompactBitArray.encode(bA).finish();

    const actualHex = bytesToHex(bz);
    expect(actualHex).toBe(hexOutput);
  });
});

describe("compactBitArrayToAmino", () => {
  test("round-trips through amino string", () => {
    const cases = [null, "_", "x", "xx___", "xx______x", "xx_____________x"];
    for (const amino of cases) {
      const cba = compactBitArrayFromAmino(amino);
      expect(compactBitArrayToAmino(cba)).toBe(amino);
    }
  });
});
