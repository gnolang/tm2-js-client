import { ConsensusParams, NetworkInfo } from '../types';
import axios from 'axios';
import { JSONRPCProvider } from '../jsonrpc/jsonrpc';
import { newResponse } from '../spec/utility';
import { RPCError } from '../spec/jsonrpc';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockURL = '127.0.0.1:26657';
const mockError: RPCError = {
  code: 1,
  message: 'mock error',
};

describe('getNetwork', () => {
  test('valid network info', async () => {
    const mockInfo: NetworkInfo = {
      listening: false,
      listeners: ['Listener 1'],
      n_peers: '10',
      peers: ['Peer 1', 'Peer 2'],
    };

    mockedAxios.post.mockResolvedValue({
      data: newResponse<NetworkInfo>(mockInfo),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getNetwork();

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(mockInfo);
  });

  test('error response', async () => {
    mockedAxios.post.mockResolvedValue({
      data: newResponse<NetworkInfo>(undefined, mockError),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);

    await expect(provider.getNetwork()).rejects.toThrow(mockError.message);
    expect(axios.post).toHaveBeenCalled();
  });
});

describe('getConsensusParams', () => {
  test('valid consensus params', async () => {
    const defaultValue = '10';
    const mockParams: ConsensusParams = {
      block_height: '1',
      consensus_params: {
        Block: {
          MaxTxBytes: defaultValue,
          MaxDataBytes: defaultValue,
          MaxGas: defaultValue,
          MaxBlockBytes: defaultValue,
          TimeIotaMS: defaultValue,
        },
        Validator: {
          PubKeyTypeURLs: [defaultValue, defaultValue],
        },
      },
    };

    mockedAxios.post.mockResolvedValue({
      data: newResponse<ConsensusParams>(mockParams),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);
    const info = await provider.getConsensusParams(1);

    expect(axios.post).toHaveBeenCalled();
    expect(info).toEqual(mockParams);
  });

  test('error response', async () => {
    mockedAxios.post.mockResolvedValue({
      data: newResponse<ConsensusParams>(undefined, mockError),
    });

    // Create the provider
    const provider = new JSONRPCProvider(mockURL);

    await expect(provider.getConsensusParams(1)).rejects.toThrow(
      mockError.message
    );
    expect(axios.post).toHaveBeenCalled();
  });
});
