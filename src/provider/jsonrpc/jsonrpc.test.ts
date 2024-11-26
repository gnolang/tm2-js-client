import { sha256 } from '@cosmjs/crypto';
import axios from 'axios';
import { mock } from 'jest-mock-extended';
import Long from 'long';
import { Tx } from '../../proto';
import { CommonEndpoint, TransactionEndpoint } from '../endpoints';
import { TM2Error } from '../errors';
import { UnauthorizedErrorMessage } from '../errors/messages';
import {
  ABCIAccount,
  ABCIErrorKey,
  ABCIResponse,
  ABCIResponseSimulateTx,
  BlockInfo,
  BlockResult,
  BroadcastTxSyncResult,
  ConsensusParams,
  NetworkInfo,
  RPCRequest,
  Status,
} from '../types';
import { newResponse, stringToBase64, uint8ArrayToBase64 } from '../utility';
import { JSONRPCProvider } from './jsonrpc';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockURL = '127.0.0.1:26657';

describe('JSON-RPC Provider', () => {
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

    const mockSimulateResponse: ABCIResponseSimulateTx = {
      Data: null,
      Error: null,
      Events: null,
      GasWanted: 0,
      GasUsed: expectedEstimation,
    };

    const mockABCIResponse: ABCIResponse = mock<ABCIResponse>();
    mockABCIResponse.response.ResponseBase = {
      Log: '',
      Info: '',
      Error: null,
      Events: null,
      Data: stringToBase64(JSON.stringify(mockSimulateResponse)),
    };

    mockedAxios.post.mockResolvedValue({
      data: newResponse<ABCIResponse>(mockABCIResponse),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const estimation = await provider.estimateGas(tx);

    expect(axios.post).toHaveBeenCalled();
    expect(estimation).toEqual(expectedEstimation);
  });

  test('getNetwork', async () => {
    const mockInfo: NetworkInfo = mock<NetworkInfo>();
    mockInfo.listening = false;

    mockedAxios.post.mockResolvedValue({
      data: newResponse<NetworkInfo>(mockInfo),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getNetwork();

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(mockInfo);
  });

  test('getBlock', async () => {
    const mockInfo: BlockInfo = mock<BlockInfo>();

    mockedAxios.post.mockResolvedValue({
      data: newResponse<BlockInfo>(mockInfo),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getBlock(0);

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(mockInfo);
  });

  test('getBlockResult', async () => {
    const mockResult: BlockResult = mock<BlockResult>();

    mockedAxios.post.mockResolvedValue({
      data: newResponse<BlockResult>(mockResult),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const result = await provider.getBlockResult(0);

    expect(axios.post).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
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
      mockedAxios.post.mockResolvedValue({
        data: newResponse<BroadcastTxSyncResult>(response),
      });

      try {
        // Create the provider
        const provider = new JSONRPCProvider(mockURL);
        const tx = await provider.sendTransaction(
          'encoded tx',
          TransactionEndpoint.BROADCAST_TX_SYNC
        );

        expect(axios.post).toHaveBeenCalled();
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

  test('waitForTransaction', async () => {
    const emptyBlock: BlockInfo = mock<BlockInfo>();
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

    const filledBlock: BlockInfo = mock<BlockInfo>();
    filledBlock.block.data = {
      txs: [uint8ArrayToBase64(encodedTx)],
    };

    const latestBlock = 5;
    const startBlock = latestBlock - 2;

    const mockStatus: Status = mock<Status>();
    mockStatus.sync_info.latest_block_height = `${latestBlock}`;

    const responseMap: Map<number, BlockInfo> = new Map<number, BlockInfo>([
      [latestBlock, filledBlock],
      [latestBlock - 1, emptyBlock],
      [startBlock, emptyBlock],
    ]);

    mockedAxios.post.mockImplementation((url, params, config): Promise<any> => {
      const request = params as RPCRequest;

      if (request.method == CommonEndpoint.STATUS) {
        return Promise.resolve({
          data: newResponse<Status>(mockStatus),
        });
      }

      if (!request.params) {
        return Promise.reject('invalid params');
      }

      const blockNum: number = +(request.params[0] as string[]);
      const info = responseMap.get(blockNum);

      return Promise.resolve({
        data: newResponse<BlockInfo>(info),
      });
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const receivedTx = await provider.waitForTransaction(
      uint8ArrayToBase64(txHash),
      startBlock
    );

    expect(axios.post).toHaveBeenCalled();
    expect(receivedTx).toEqual(tx);
  });

  test('getConsensusParams', async () => {
    const mockParams: ConsensusParams = mock<ConsensusParams>();
    mockParams.block_height = '1';

    mockedAxios.post.mockResolvedValue({
      data: newResponse<ConsensusParams>(mockParams),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const params = await provider.getConsensusParams(1);

    expect(axios.post).toHaveBeenCalled();
    expect(params).toEqual(mockParams);
  });

  test('getStatus', async () => {
    const mockStatus: Status = mock<Status>();
    mockStatus.validator_info.address = 'address';

    mockedAxios.post.mockResolvedValue({
      data: newResponse<Status>(mockStatus),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const status = await provider.getStatus();

    expect(axios.post).toHaveBeenCalled();
    expect(status).toEqual(mockStatus);
  });

  test('getBlockNumber', async () => {
    const expectedBlockNumber = 10;
    const mockStatus: Status = mock<Status>();
    mockStatus.sync_info.latest_block_height = `${expectedBlockNumber}`;

    mockedAxios.post.mockResolvedValue({
      data: newResponse<Status>(mockStatus),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const blockNumber = await provider.getBlockNumber();

    expect(axios.post).toHaveBeenCalled();
    expect(blockNumber).toEqual(expectedBlockNumber);
  });

  describe('getBalance', () => {
    const denomination = 'atom';
    test.each([
      ['"5gnot,100atom"', 100], // balance found
      ['"5universe"', 0], // balance not found
      ['""', 0], // account doesn't exist
    ])('case %#', async (existing, expected) => {
      const mockABCIResponse: ABCIResponse = mock<ABCIResponse>();
      mockABCIResponse.response.ResponseBase = {
        Log: '',
        Info: '',
        Data: stringToBase64(existing),
        Error: null,
        Events: null,
      };

      mockedAxios.post.mockResolvedValue({
        data: newResponse<ABCIResponse>(mockABCIResponse),
      });

      // Create the provider
      const provider = new JSONRPCProvider(mockURL);
      const balance = await provider.getBalance('address', denomination);

      expect(axios.post).toHaveBeenCalled();
      expect(balance).toBe(expected);
    });
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
      const mockABCIResponse: ABCIResponse = mock<ABCIResponse>();
      mockABCIResponse.response.ResponseBase = {
        Log: '',
        Info: '',
        Data: stringToBase64(response),
        Error: null,
        Events: null,
      };

      mockedAxios.post.mockResolvedValue({
        data: newResponse<ABCIResponse>(mockABCIResponse),
      });

      // Create the provider
      const provider = new JSONRPCProvider(mockURL);
      const sequence = await provider.getAccountSequence('address');

      expect(axios.post).toHaveBeenCalled();
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
      const mockABCIResponse: ABCIResponse = mock<ABCIResponse>();
      mockABCIResponse.response.ResponseBase = {
        Log: '',
        Info: '',
        Data: stringToBase64(response),
        Error: null,
        Events: null,
      };

      mockedAxios.post.mockResolvedValue({
        data: newResponse<ABCIResponse>(mockABCIResponse),
      });

      try {
        // Create the provider
        const provider = new JSONRPCProvider(mockURL);
        const accountNumber = await provider.getAccountNumber('address');

        expect(axios.post).toHaveBeenCalled();
        expect(accountNumber).toBe(expected);
      } catch (e) {
        expect((e as Error).message).toContain('account is not initialized');
      }
    });
  });
});
