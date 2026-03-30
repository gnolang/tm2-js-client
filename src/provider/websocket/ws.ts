import {
  Tm2Client,
} from "@gnolang/tm2-rpc";

import {
  BaseTm2Provider,
} from "../provider.js";

/**
 * Provider based on WS JSON-RPC requests
 */
export class WSProvider extends BaseTm2Provider {
  /**
   * Creates a new instance of the {@link WSProvider}
   * @param {string} baseURL the WS URL of the node
   */
  static async create(baseURL: string): Promise<WSProvider> {
    const client = await Tm2Client.connect(baseURL);
    return new WSProvider(client);
  }

  /**
   * Closes the WS connection. Required when done working
   * with the WS provider
   */
  closeConnection() {
    this.client.disconnect();
  }
}
