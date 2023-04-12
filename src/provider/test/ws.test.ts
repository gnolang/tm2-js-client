import { NetworkInfo } from '../types';
import { WebSocketServer } from 'ws';
import { WSProvider } from '../websocket/websocket';
import { newResponse } from '../spec/utility';

describe('WS Provider', () => {
  const wsPort = 8545;
  const wsHost = 'localhost';
  const wsURL = `ws://${wsHost}:${wsPort}`;

  let wsProvider: WSProvider;
  let server: WebSocketServer;

  beforeEach(async () => {
    server = new WebSocketServer({
      host: wsHost,
      port: wsPort,
    });
    wsProvider = new WSProvider(wsURL);
  });

  afterEach(() => {
    wsProvider.closeConnection();
    server.close();
  });

  test('getNetwork', async () => {
    const mockInfo: NetworkInfo = {
      listening: false,
      listeners: [],
      n_peers: '0',
      peers: [],
    };

    server.on('connection', (socket) => {
      socket.on('message', (data) => {
        const request = JSON.parse(data.toString());
        const response = newResponse<NetworkInfo>(mockInfo);
        response.id = request.id;

        socket.send(JSON.stringify(response));
      });
    });

    const info = await wsProvider.getNetwork();
    expect(info).toEqual(mockInfo);
  });
});
