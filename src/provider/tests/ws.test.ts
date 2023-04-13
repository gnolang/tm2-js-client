import {
  ConsensusParams,
  ConsensusState,
  consensusStateKey,
  NetworkInfo,
  Status,
} from '../types';
import { WebSocketServer } from 'ws';
import { WSProvider } from '../websocket/websocket';
import { newResponse, stringToBase64 } from '../spec/utility';
import { ABCIAccount } from '../abciTypes';
import { ABCIResponse } from '../spec/abci';

// TODO Resolve wss contention
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

  test('getStatus', async () => {
    const mockStatus: Status = {
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

  test('getBlockNumber', async () => {
    const expectedBlockNumber = 10;
    const mockState: ConsensusState = {
      round_state: {
        start_time: '',
        proposal_block_hash: '',
        locked_block_hash: '',
        valid_block_hash: '',
        height_vote_set: {},
      },
    };
    mockState.round_state[consensusStateKey] = `${expectedBlockNumber}/0/0`;

    // Set the response
    setHandler<ConsensusState>(mockState);

    const blockNumber: number = await wsProvider.getBlockNumber();
    expect(blockNumber).toBe(expectedBlockNumber);
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
});
