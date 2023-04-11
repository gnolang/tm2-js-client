import {
  ConsensusParams,
  ConsensusState,
  consensusStateKey,
  NetworkInfo,
  Status,
} from '../types';
import axios from 'axios';
import { JSONRPCProvider } from '../jsonrpc/jsonrpc';
import { newResponse } from '../spec/utility';
import { mock } from 'jest-mock-extended';
import { ABCIResponse } from '../spec/abci';
import { ABCIAccount } from '../abciTypes';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockURL = '127.0.0.1:26657';

describe('JSON-RPC Provider', () => {
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

  test('getConsensusParams', async () => {
    const mockParams: ConsensusParams = mock<ConsensusParams>();
    mockParams.block_height = '1';

    mockedAxios.post.mockResolvedValue({
      data: newResponse<ConsensusParams>(mockParams),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getConsensusParams(1);

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(mockParams);
  });

  test('getStatus', async () => {
    const mockStatus: Status = mock<Status>();
    mockStatus.validator_info.address = 'address';

    mockedAxios.post.mockResolvedValue({
      data: newResponse<Status>(mockStatus),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getStatus();

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(mockStatus);
  });

  test('getBlockNumber', async () => {
    const expectedBlockNumber = 10;
    const mockState: ConsensusState = mock<ConsensusState>();
    mockState.round_state[consensusStateKey] = `${expectedBlockNumber}/0/0`;

    mockedAxios.post.mockResolvedValue({
      data: newResponse<ConsensusState>(mockState),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getBlockNumber();

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(expectedBlockNumber);
  });

  describe('getBalance', () => {
    const denomination = 'atom';
    test.each([
      ['5gnot,100atom', 100], // balance found
      ['5universe', 0], // balance not found
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
      const sequence = await provider.getSequence('address');

      expect(axios.post).toHaveBeenCalled();
      expect(sequence).toBe(expected);
    });
  });
});

/**
 * Converts a string into base64 representation
 * @param {string} str the raw string
 * @returns {string} the base64 representation of the string
 */
const stringToBase64 = (str: string): string => {
  const buffer = Buffer.from(str, 'utf-8');

  return buffer.toString('base64');
};
