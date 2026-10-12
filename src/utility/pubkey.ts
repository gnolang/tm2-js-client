import type {
  Any,
} from "../proto/google/protobuf/any.js";
import {
  PubKeyMultisig,
} from "../proto/tm2/multisig.js";
import {
  PubKeySecp256k1, type TxSignature,
} from "../proto/tm2/tx.js";

export interface AminoPubKey {
  "@type": string
  [field: string]: unknown
}

export interface AminoTxSignature {
  pub_key: AminoPubKey | null
  signature: string
  session_addr?: string
}

// Spreading into fromCharCode is fine for key and signature sizes only.
const toBase64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes));

/**
 * Converts a protobuf wrapped public key into the Amino JSON form
 * printed by the chain and gnokey. Unknown key types keep their raw value.
 */
export function pubKeyToAminoJSON(pubKey: Any): AminoPubKey {
  const type = pubKey.type_url;

  switch (type) {
    case "/tm.PubKeySecp256k1":
      return {
        "@type": type,
        value: toBase64(PubKeySecp256k1.decode(pubKey.value).key),
      };
    case "/tm.PubKeyMultisig": {
      const multisig = PubKeyMultisig.decode(pubKey.value);

      return {
        "@type": type,
        threshold: multisig.k.toString(),
        pubkeys: multisig.pub_keys.map(pubKeyToAminoJSON),
      };
    }
    default:
      return {
        "@type": type,
        value: toBase64(pubKey.value),
      };
  }
}

/**
 * Converts a transaction signature into the Amino JSON form used by the chain.
 * The session address is omitted for master key signatures.
 */
export function txSignatureToAminoJSON(sig: TxSignature): AminoTxSignature {
  const result: AminoTxSignature = {
    pub_key: sig.pub_key ? pubKeyToAminoJSON(sig.pub_key) : null,
    signature: toBase64(sig.signature),
  };

  if (sig.session_addr) {
    result.session_addr = sig.session_addr;
  }

  return result;
}
