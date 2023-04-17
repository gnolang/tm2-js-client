export interface ABCIResponse {
  response: {
    ResponseBase: ABCIResponseBase;
    Key: string | null;
    Value: string | null;
    Proof: MerkleProof | null;
    Height: string;
  };
}

export interface ABCIResponseBase {
  Error: {
    // ABCIErrorKey
    [key: string]: string;
  } | null;
  Data: string | null;
  Events: string | null;
  Log: string;
  Info: string;
}

interface MerkleProof {
  ops: {
    type: string;
    key: string | null;
    data: string | null;
  }[];
}

export const ABCIErrorKey = '@type';
