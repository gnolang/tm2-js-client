import { sha256 } from '@cosmjs/crypto';
import WS from 'jest-websocket-mock';
import Long from 'long';
import { Tx } from '../../proto';
import { CommonEndpoint, TransactionEndpoint } from '../endpoints';
import { TM2Error } from '../errors';
import { UnauthorizedErrorMessage } from '../errors/messages';
import {
  ABCIAccount,
  ABCIErrorKey,
  ABCIResponse,
  ABCIResponseBase,
  BeginBlock,
  BlockInfo,
  BlockResult,
  BroadcastTxSyncResult,
  ConsensusParams,
  DeliverTx,
  EndBlock,
  NetworkInfo,
  Status,
} from '../types';
import { newResponse, stringToBase64, uint8ArrayToBase64 } from '../utility';
import { WSProvider } from './ws';

describe('WS Provider', () => {
  const wsPort = 8545;
  const wsHost = 'localhost';
  const wsURL = `ws://${wsHost}:${wsPort}`;

  let server: WS;
  let wsProvider: WSProvider;

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

  /**
   * Sets up the test response handler (single-response)
   * @param {WebSocketServer} wss the websocket server returning data
   * @param {Type} testData the test data being returned to the client
   */
  const setHandler = async <Type>(testData: Type) => {
    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        const request = JSON.parse(data.toString());
        const response = newResponse<Type>(testData);
        response.id = request.id;

        socket.send(JSON.stringify(response));
      });
    });

    await server.connected;
  };

  beforeEach(() => {
    server = new WS(wsURL);
    wsProvider = new WSProvider(wsURL);
  });

  afterEach(() => {
    wsProvider.closeConnection();
    WS.clean();
  });

  test('estimateGas', async () => {
    const tx = Tx.fromJSON({
      signatures: [],
      fee: {
        gasFee: '',
        gasWanted: new Long(0),
      },
      messages: [],
      memo: '',
    });
    const expectedEstimation = 1000;

    const mockSimulateResponse: DeliverTx = {
      ResponseBase: {
        Data: null,
        Error: null,
        Events: null,
        Info: '',
        Log: '',
      },
      GasWanted: '0',
      GasUsed: expectedEstimation.toString(),
    };

    const mockABCIResponse: ABCIResponse = {
      response: {
        Height: '',
        Key: '',
        Proof: null,
        Value: stringToBase64(JSON.stringify(mockSimulateResponse)),
        ResponseBase: {
          Log: '',
          Info: '',
          Error: null,
          Events: null,
          Data: '',
        },
      },
    };

    // Set the response
    await setHandler<ABCIResponse>(mockABCIResponse);

    const estimation = await wsProvider.estimateGas(tx);

    expect(estimation).toEqual(expectedEstimation);
  });

  test('getNetwork', async () => {
    const mockInfo: NetworkInfo = {
      listening: false,
      listeners: [],
      n_peers: '0',
      peers: [],
    };

    // Set the response
    await setHandler<NetworkInfo>(mockInfo);

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
    await setHandler<Status>(mockStatus);

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
    await setHandler<ConsensusParams>(mockParams);

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
      await setHandler<ABCIResponse>(mockResponse);

      const sequence: number = await wsProvider.getAccountSequence('address');
      expect(sequence).toBe(expected);
    });
  });

  describe('getAccountNumber', () => {
    const validAccount: ABCIAccount = {
      BaseAccount: {
        address: 'random address',
        coins: '',
        public_key: null,
        account_number: '10',
        sequence: '0',
      },
    };

    test.each([
      [
        JSON.stringify(validAccount),
        parseInt(validAccount.BaseAccount.account_number, 10),
      ], // account exists
      ['null', 0], // account doesn't exist
    ])('case %#', async (response, expected) => {
      const mockResponse: ABCIResponse = mockABCIResponse(response);

      // Set the response
      await setHandler<ABCIResponse>(mockResponse);

      try {
        const accountNumber: number =
          await wsProvider.getAccountNumber('address');
        expect(accountNumber).toBe(expected);
      } catch (e) {
        expect((e as Error).message).toContain('account is not initialized');
      }
    });
  });

  describe('getBalance', () => {
    const denomination = 'atom';
    test.each([
      ['"5gnot,100atom"', 100], // balance found
      ['"5universe"', 0], // balance not found
      ['""', 0], // account doesn't exist
    ])('case %#', async (existing, expected) => {
      const mockResponse: ABCIResponse = mockABCIResponse(existing);

      // Set the response
      await setHandler<ABCIResponse>(mockResponse);

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
    await setHandler<Status>(mockStatus);

    const blockNumber: number = await wsProvider.getBlockNumber();
    expect(blockNumber).toBe(expectedBlockNumber);
  });

  describe('sendTransaction', () => {
    const validResult: BroadcastTxSyncResult = {
      error: null,
      data: null,
      Log: '',
      hash: 'hash123',
    };

    const mockError = '/std.UnauthorizedError';
    const mockLog = 'random error message';
    const invalidResult: BroadcastTxSyncResult = {
      error: {
        [ABCIErrorKey]: mockError,
      },
      data: null,
      Log: mockLog,
      hash: '',
    };

    test.each([
      [validResult, validResult.hash, '', ''], // no error
      [invalidResult, invalidResult.hash, UnauthorizedErrorMessage, mockLog], // error out
    ])('case %#', async (response, expectedHash, expectedErr, expectedLog) => {
      await setHandler<BroadcastTxSyncResult>(response);

      try {
        const tx = await wsProvider.sendTransaction(
          'encoded tx',
          TransactionEndpoint.BROADCAST_TX_SYNC
        );

        expect(tx.hash).toEqual(expectedHash);

        if (expectedErr != '') {
          fail('expected error');
        }
      } catch (e) {
        expect((e as Error).message).toBe(expectedErr);
        expect((e as TM2Error).log).toBe(expectedLog);
      }
    });
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
    await setHandler<BlockInfo>(mockInfo);

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
      results: {
        deliver_tx: null,
        end_block: emptyEndBlock,
        begin_block: emptyStartBlock,
      },
    };
  };

  test('getBlockResult', async () => {
    const mockResult: BlockResult = getEmptyBlockResult();

    // Set the response
    await setHandler<BlockResult>(mockResult);

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

    await server.connected;

    const receivedTx: Tx = await wsProvider.waitForTransaction(
      uint8ArrayToBase64(txHash),
      startBlock
    );
    expect(receivedTx).toEqual(tx);
  });
});
