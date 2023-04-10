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
});
