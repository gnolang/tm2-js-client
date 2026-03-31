import type {
  CompactBitArray,
} from "../proto/tm2/multisig.js";

/**
 * Converts an amino-encoded compact bit array string to a CompactBitArray.
 * In the amino format, 'x' represents a set bit (1) and '_' represents
 * an unset bit (0). A null input produces an empty CompactBitArray.
 *
 * @example
 * compactBitArrayFromAmino("xx___") // { extra_bits_stored: 5, elems: Uint8Array([0xC0]) }
 * compactBitArrayFromAmino(null)    // { extra_bits_stored: 0, elems: Uint8Array([]) }
 */
export function compactBitArrayFromAmino(
  amino: string | null,
): CompactBitArray {
  if (amino === null) {
    return {
      extra_bits_stored: 0,
      elems: new Uint8Array(0),
    };
  }

  const count = amino.length;
  const extraBits = count % 8;
  const numBytes = Math.ceil(count / 8);
  const elems = new Uint8Array(numBytes);

  for (let i = 0; i < count; i++) {
    if (amino[i] === "x") {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = 7 - (i % 8);
      elems[byteIndex] |= 1 << bitIndex;
    }
  }

  return {
    extra_bits_stored: extraBits,
    elems,
  };
}

/**
 * Converts a CompactBitArray to its amino string representation.
 * Set bits (1) become 'x' and unset bits (0) become '_'.
 * Returns null for empty bit arrays (zero length).
 *
 * @example
 * compactBitArrayToAmino({ extra_bits_stored: 5, elems: Uint8Array([0xC0]) }) // "xx___"
 * compactBitArrayToAmino({ extra_bits_stored: 0, elems: Uint8Array([]) })     // null
 */
export function compactBitArrayToAmino(
  cba: CompactBitArray,
): string | null {
  if (cba.elems.length === 0) {
    return null;
  }

  const fullBytes = cba.extra_bits_stored === 0
    ? cba.elems.length
    : cba.elems.length - 1;
  const totalBits = fullBytes * 8 + cba.extra_bits_stored;

  let result = "";
  for (let i = 0; i < totalBits; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = 7 - (i % 8);
    const isSet = (cba.elems[byteIndex] & (1 << bitIndex)) !== 0;
    result += isSet ? "x" : "_";
  }

  return result;
}
