import {
  BeginBlock,
  BlockInfo,
  BlockResult,
  BroadcastTxResult,
  ConsensusParams,
  EndBlock,
  NetworkInfo,
  Status,
} from '../types/common';
import { WebSocketServer } from 'ws';
import { WSProvider } from './ws';
import {
  newResponse,
  stringToBase64,
  uint8ArrayToBase64,
} from '../utility/requests.utility';
import { ABCIAccount, ABCIResponse, ABCIResponseBase } from '../types/abci';
import { Tx } from '../../proto/tm2/tx';
import { sha256 } from '@cosmjs/crypto';
import { CommonEndpoint } from '../endpoints';

describe.skip('WS Provider', () => {
  const wsPort = 8545;
  const wsHost = 'localhost';
  const wsURL = `ws://${wsHost}:${wsPort}`;

  let wsProvider: WSProvider;
  let server: WebSocketServer;

  /**
   * Sets up the test response handler (single-response)
   * @param {WebSocketServer} wss the websocket server returning data
   * @param {Type} testData the test data being returned to the client
   */
  const setHandler = <Type>(testData: Type) => {
    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        const request = JSON.parse(data.toString());
        const response = newResponse<Type>(testData);
        response.id = request.id;

        socket.send(JSON.stringify(response));
      });
    });
  };

  const mockABCIResponse = (response: string): ABCIResponse => {
    return {
      response: {
        ResponseBase: {
          Log: '',
          Info: '',
          Data: stringToBase64(response),
          Error: null,
          Events: null,
        },
        Key: null,
        Value: null,
        Proof: null,
        Height: '',
      },
    };
  };

  beforeEach(async () => {
    server = new WebSocketServer({
      host: wsHost,
      port: wsPort,
    });

    wsProvider = new WSProvider(wsURL);
  });

  afterEach(() => {
    server.removeAllListeners();
    server.close();
    wsProvider.closeConnection();
  });

  test('getNetwork', async () => {
    const mockInfo: NetworkInfo = {
      listening: false,
      listeners: [],
      n_peers: '0',
      peers: [],
    };

    // Set the response
    setHandler<NetworkInfo>(mockInfo);

    const info: NetworkInfo = await wsProvider.getNetwork();
    expect(info).toEqual(mockInfo);
  });

  const getEmptyStatus = (): Status => {
    return {
      node_info: {
        version_set: [],
        net_address: '',
        network: '',
        software: '',
        version: '',
        channels: '',
        monkier: '',
        other: {
          tx_index: '',
          rpc_address: '',
        },
      },
      sync_info: {
        latest_block_hash: '',
        latest_app_hash: '',
        latest_block_height: '',
        latest_block_time: '',
        catching_up: false,
      },
      validator_info: {
        address: '',
        pub_key: {
          type: '',
          value: '',
        },
        voting_power: '',
      },
    };
  };

  test('getStatus', async () => {
    const mockStatus: Status = getEmptyStatus();
    mockStatus.validator_info.address = 'address';

    // Set the response
    setHandler<Status>(mockStatus);

    const status: Status = await wsProvider.getStatus();
    expect(status).toEqual(status);
  });

  test('getConsensusParams', async () => {
    const mockParams: ConsensusParams = {
      block_height: '',
      consensus_params: {
        Block: {
          MaxTxBytes: '',
          MaxDataBytes: '',
          MaxBlockBytes: '',
          MaxGas: '',
          TimeIotaMS: '',
        },
        Validator: {
          PubKeyTypeURLs: [],
        },
      },
    };

    // Set the response
    setHandler<ConsensusParams>(mockParams);

    const params: ConsensusParams = await wsProvider.getConsensusParams(1);
    expect(params).toEqual(mockParams);
  });

  describe('getSequence', () => {
    const validAccount: ABCIAccount = {
      BaseAccount: {
        address: 'random address',
        coins: '',
        public_key: null,
        account_number: '0',
        sequence: '10',
      },
    };

    test.each([
      [
        JSON.stringify(validAccount),
        parseInt(validAccount.BaseAccount.sequence, 10),
      ], // account exists
      ['null', 0], // account doesn't exist
    ])('case %#', async (response, expected) => {
      const mockResponse: ABCIResponse = mockABCIResponse(response);

      // Set the response
      setHandler<ABCIResponse>(mockResponse);

      const sequence: number = await wsProvider.getSequence('address');
      expect(sequence).toBe(expected);
    });
  });

  describe('getBalance', () => {
    const denomination = 'atom';
    test.each([
      ['5gnot,100atom', 100], // balance found
      ['5universe', 0], // balance not found
      ['""', 0], // account doesn't exist
    ])('case %#', async (existing, expected) => {
      const mockResponse: ABCIResponse = mockABCIResponse(existing);

      // Set the response
      setHandler<ABCIResponse>(mockResponse);

      const balance: number = await wsProvider.getBalance(
        'address',
        denomination
      );
      expect(balance).toBe(expected);
    });
  });

  test('getBlockNumber', async () => {
    const expectedBlockNumber = 10;
    const mockStatus: Status = getEmptyStatus();
    mockStatus.sync_info.latest_block_height = `${expectedBlockNumber}`;

    // Set the response
    setHandler<Status>(mockStatus);

    const blockNumber: number = await wsProvider.getBlockNumber();
    expect(blockNumber).toBe(expectedBlockNumber);
  });

  test('sendTransaction', async () => {
    const mockResult: BroadcastTxResult = {
      error: null,
      data: null,
      Log: '',
      hash: 'hash123',
    };

    // Set the response
    setHandler<BroadcastTxResult>(mockResult);

    const hash: string = await wsProvider.sendTransaction('encoded tx');
    expect(hash).toBe(mockResult.hash);
  });

  const getEmptyBlockInfo = (): BlockInfo => {
    const emptyHeader = {
      version: '',
      chain_id: '',
      height: '',
      time: '',
      num_txs: '',
      total_txs: '',
      app_version: '',
      last_block_id: {
        hash: null,
        parts: {
          total: '',
          hash: null,
        },
      },
      last_commit_hash: '',
      data_hash: '',
      validators_hash: '',
      consensus_hash: '',
      app_hash: '',
      last_results_hash: '',
      proposer_address: '',
    };

    const emptyBlockID = {
      hash: null,
      parts: {
        total: '',
        hash: null,
      },
    };

    return {
      block_meta: {
        block_id: emptyBlockID,
        header: emptyHeader,
      },
      block: {
        header: emptyHeader,
        data: {
          txs: null,
        },
        last_commit: {
          block_id: emptyBlockID,
          precommits: null,
        },
      },
    };
  };

  test('getBlock', async () => {
    const mockInfo: BlockInfo = getEmptyBlockInfo();

    // Set the response
    setHandler<BlockInfo>(mockInfo);

    const result: BlockInfo = await wsProvider.getBlock(0);
    expect(result).toEqual(mockInfo);
  });

  const getEmptyBlockResult = (): BlockResult => {
    const emptyResponseBase: ABCIResponseBase = {
      Error: null,
      Data: null,
      Events: null,
      Log: '',
      Info: '',
    };

    const emptyEndBlock: EndBlock = {
      ResponseBase: emptyResponseBase,
      ValidatorUpdates: null,
      ConsensusParams: null,
      Events: null,
    };

    const emptyStartBlock: BeginBlock = {
      ResponseBase: emptyResponseBase,
    };

    return {
      height: '',
      result: {
        deliver_tx: null,
        end_block: emptyEndBlock,
        begin_block: emptyStartBlock,
      },
    };
  };

  test('getBlockResult', async () => {
    const mockResult: BlockResult = getEmptyBlockResult();

    // Set the response
    setHandler<BlockResult>(mockResult);

    const result: BlockResult = await wsProvider.getBlockResult(0);
    expect(result).toEqual(mockResult);
  });

  test('waitForTransaction', async () => {
    const emptyBlock: BlockInfo = getEmptyBlockInfo();
    emptyBlock.block.data = {
      txs: [],
    };

    const tx: Tx = {
      messages: [],
      signatures: [],
      memo: 'tx memo',
    };

    const encodedTx = Tx.encode(tx).finish();
    const txHash = sha256(encodedTx);

    const filledBlock: BlockInfo = getEmptyBlockInfo();
    filledBlock.block.data = {
      txs: [uint8ArrayToBase64(encodedTx)],
    };

    const latestBlock = 5;
    const startBlock = latestBlock - 2;

    const mockStatus: Status = getEmptyStatus();
    mockStatus.sync_info.latest_block_height = `${latestBlock}`;

    const responseMap: Map<number, BlockInfo> = new Map<number, BlockInfo>([
      [latestBlock, filledBlock],
      [latestBlock - 1, emptyBlock],
      [startBlock, emptyBlock],
    ]);

    // Set the response
    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        const request = JSON.parse(data.toString());

        if (request.method == CommonEndpoint.STATUS) {
          const response = newResponse<Status>(mockStatus);
          response.id = request.id;

          socket.send(JSON.stringify(response));

          return;
        }

        if (!request.params) {
          return;
        }

        const blockNum: number = +(request.params[0] as string[]);
        const info = responseMap.get(blockNum);

        const response = newResponse<BlockInfo>(info);
        response.id = request.id;

        socket.send(JSON.stringify(response));
      });
    });

    const receivedTx: Tx = await wsProvider.waitForTransaction(
      uint8ArrayToBase64(txHash),
      startBlock
    );
    expect(receivedTx).toEqual(tx);
  });
});
