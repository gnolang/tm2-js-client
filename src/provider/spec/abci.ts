export interface ABCIResponse {
  response: {
    ResponseBase: {
      Error: {
        // ABCIErrorKey
        [key: string]: string;
      } | null;
      Data: string;
      Events: null;
      Log: string;
      Info: string;
    };
    Key: string | null;
    Value: string | null;
    Proof: MerkleProof | null;
    Height: string;
  };
}

interface MerkleProof {
  ops: {
    type: string;
    key: string | null;
    data: string | null;
  }[];
}

export const ABCIErrorKey = '@type';
