import { bytesToHex } from '@noble/hashes/utils';
import { CompactBitArray } from './multisig';

describe('TestMarshalCompactBitArrayAmino', () => {
  const testCases = [
    { marshalledBA: `null`, hexOutput: '' },
    { marshalledBA: `null`, hexOutput: '' },
    { marshalledBA: `"_"`, hexOutput: '0801120100' },
    { marshalledBA: `"x"`, hexOutput: '0801120180' },
    { marshalledBA: `"xx___"`, hexOutput: '08051201c0' },
    { marshalledBA: `"xx______x"`, hexOutput: '08011202c080' },
    { marshalledBA: `"xx_____________x"`, hexOutput: '1202c001' },
  ];

  test.each(testCases)('$marshalledBA', async ({ marshalledBA, hexOutput }) => {
    // Parse JSON into CompactBitArray
    const jsonData = JSON.parse(marshalledBA);
    const bA = CompactBitArray.fromJSON(jsonData);

    // Marshal using Amino
    const bz = CompactBitArray.encode(bA).finish();

    // Convert bytes to hex and compare
    const actualHex = bytesToHex(bz);
    expect(actualHex).toBe(hexOutput);
  });
});