/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'tm2.tx';

export interface Tx {
  /** specific message types */
  messages: TxMessage[];
  /** transaction costs (fee) */
  fee?: TxFee;
  /** the signatures for the transaction */
  signatures: TxSignature[];
  /** memo attached to the transaction */
  memo: string;
}

export interface TxFee {
  /** gas limit */
  gasWanted: Long;
  /** gas fee details (<value><denomination>) */
  gasFee: string;
}

export interface TxSignature {
  /** public key associated with the signature */
  pubKey?: PublicKey;
  /** the signature */
  signature: Uint8Array;
}

export interface PublicKey {
  /** type of public key */
  type: string;
  /** public key value */
  value: Uint8Array;
}

export interface TxMessage {
  /** URL of the message */
  typeUrl: string;
  /** data value of the message */
  value: Uint8Array;
}

function createBaseTx(): Tx {
  return { messages: [], fee: undefined, signatures: [], memo: '' };
}

export const Tx = {
  encode(message: Tx, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      TxMessage.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.fee !== undefined) {
      TxFee.encode(message.fee, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.signatures) {
      TxSignature.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.memo !== '') {
      writer.uint32(34).string(message.memo);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Tx {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTx();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(TxMessage.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.fee = TxFee.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.signatures.push(TxSignature.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.memo = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Tx {
    return {
      messages: Array.isArray(object?.messages)
        ? object.messages.map((e: any) => TxMessage.fromJSON(e))
        : [],
      fee: isSet(object.fee) ? TxFee.fromJSON(object.fee) : undefined,
      signatures: Array.isArray(object?.signatures)
        ? object.signatures.map((e: any) => TxSignature.fromJSON(e))
        : [],
      memo: isSet(object.memo) ? String(object.memo) : '',
    };
  },

  toJSON(message: Tx): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) =>
        e ? TxMessage.toJSON(e) : undefined
      );
    } else {
      obj.messages = [];
    }
    message.fee !== undefined &&
      (obj.fee = message.fee ? TxFee.toJSON(message.fee) : undefined);
    if (message.signatures) {
      obj.signatures = message.signatures.map((e) =>
        e ? TxSignature.toJSON(e) : undefined
      );
    } else {
      obj.signatures = [];
    }
    message.memo !== undefined && (obj.memo = message.memo);
    return obj;
  },

  create<I extends Exact<DeepPartial<Tx>, I>>(base?: I): Tx {
    return Tx.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Tx>, I>>(object: I): Tx {
    const message = createBaseTx();
    message.messages =
      object.messages?.map((e) => TxMessage.fromPartial(e)) || [];
    message.fee =
      object.fee !== undefined && object.fee !== null
        ? TxFee.fromPartial(object.fee)
        : undefined;
    message.signatures =
      object.signatures?.map((e) => TxSignature.fromPartial(e)) || [];
    message.memo = object.memo ?? '';
    return message;
  },
};

function createBaseTxFee(): TxFee {
  return { gasWanted: Long.ZERO, gasFee: '' };
}

export const TxFee = {
  encode(message: TxFee, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (!message.gasWanted.isZero()) {
      writer.uint32(8).sint64(message.gasWanted);
    }
    if (message.gasFee !== '') {
      writer.uint32(18).string(message.gasFee);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TxFee {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTxFee();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.gasWanted = reader.sint64() as Long;
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.gasFee = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TxFee {
    return {
      gasWanted: isSet(object.gasWanted)
        ? Long.fromValue(object.gasWanted)
        : Long.ZERO,
      gasFee: isSet(object.gasFee) ? String(object.gasFee) : '',
    };
  },

  toJSON(message: TxFee): unknown {
    const obj: any = {};
    message.gasWanted !== undefined &&
      (obj.gasWanted = (message.gasWanted || Long.ZERO).toString());
    message.gasFee !== undefined && (obj.gasFee = message.gasFee);
    return obj;
  },

  create<I extends Exact<DeepPartial<TxFee>, I>>(base?: I): TxFee {
    return TxFee.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TxFee>, I>>(object: I): TxFee {
    const message = createBaseTxFee();
    message.gasWanted =
      object.gasWanted !== undefined && object.gasWanted !== null
        ? Long.fromValue(object.gasWanted)
        : Long.ZERO;
    message.gasFee = object.gasFee ?? '';
    return message;
  },
};

function createBaseTxSignature(): TxSignature {
  return { pubKey: undefined, signature: new Uint8Array() };
}

export const TxSignature = {
  encode(
    message: TxSignature,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.pubKey !== undefined) {
      PublicKey.encode(message.pubKey, writer.uint32(10).fork()).ldelim();
    }
    if (message.signature.length !== 0) {
      writer.uint32(18).bytes(message.signature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TxSignature {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTxSignature();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.pubKey = PublicKey.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.signature = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TxSignature {
    return {
      pubKey: isSet(object.pubKey)
        ? PublicKey.fromJSON(object.pubKey)
        : undefined,
      signature: isSet(object.signature)
        ? bytesFromBase64(object.signature)
        : new Uint8Array(),
    };
  },

  toJSON(message: TxSignature): unknown {
    const obj: any = {};
    message.pubKey !== undefined &&
      (obj.pubKey = message.pubKey
        ? PublicKey.toJSON(message.pubKey)
        : undefined);
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(
        message.signature !== undefined ? message.signature : new Uint8Array()
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<TxSignature>, I>>(base?: I): TxSignature {
    return TxSignature.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TxSignature>, I>>(
    object: I
  ): TxSignature {
    const message = createBaseTxSignature();
    message.pubKey =
      object.pubKey !== undefined && object.pubKey !== null
        ? PublicKey.fromPartial(object.pubKey)
        : undefined;
    message.signature = object.signature ?? new Uint8Array();
    return message;
  },
};

function createBasePublicKey(): PublicKey {
  return { type: '', value: new Uint8Array() };
}

export const PublicKey = {
  encode(
    message: PublicKey,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.type !== '') {
      writer.uint32(10).string(message.type);
    }
    if (message.value.length !== 0) {
      writer.uint32(18).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PublicKey {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePublicKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PublicKey {
    return {
      type: isSet(object.type) ? String(object.type) : '',
      value: isSet(object.value)
        ? bytesFromBase64(object.value)
        : new Uint8Array(),
    };
  },

  toJSON(message: PublicKey): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = message.type);
    message.value !== undefined &&
      (obj.value = base64FromBytes(
        message.value !== undefined ? message.value : new Uint8Array()
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<PublicKey>, I>>(base?: I): PublicKey {
    return PublicKey.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PublicKey>, I>>(
    object: I
  ): PublicKey {
    const message = createBasePublicKey();
    message.type = object.type ?? '';
    message.value = object.value ?? new Uint8Array();
    return message;
  },
};

function createBaseTxMessage(): TxMessage {
  return { typeUrl: '', value: new Uint8Array() };
}

export const TxMessage = {
  encode(
    message: TxMessage,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.typeUrl !== '') {
      writer.uint32(10).string(message.typeUrl);
    }
    if (message.value.length !== 0) {
      writer.uint32(18).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TxMessage {
    const reader =
      input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTxMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.typeUrl = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TxMessage {
    return {
      typeUrl: isSet(object.typeUrl) ? String(object.typeUrl) : '',
      value: isSet(object.value)
        ? bytesFromBase64(object.value)
        : new Uint8Array(),
    };
  },

  toJSON(message: TxMessage): unknown {
    const obj: any = {};
    message.typeUrl !== undefined && (obj.typeUrl = message.typeUrl);
    message.value !== undefined &&
      (obj.value = base64FromBytes(
        message.value !== undefined ? message.value : new Uint8Array()
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<TxMessage>, I>>(base?: I): TxMessage {
    return TxMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TxMessage>, I>>(
    object: I
  ): TxMessage {
    const message = createBaseTxMessage();
    message.typeUrl = object.typeUrl ?? '';
    message.value = object.value ?? new Uint8Array();
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, 'base64'));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(''));
  }
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Long
  ? string | number | Long
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
