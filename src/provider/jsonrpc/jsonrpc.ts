import {
  Tm2Client,
} from "@gnolang/tm2-rpc";

import {
  BaseTm2Provider,
} from "../provider.js";

/**
 * Provider based on JSON-RPC HTTP requests
 */
export class JSONRPCProvider extends BaseTm2Provider {
  /**
   * Creates a new instance of the JSON-RPC Provider
   * @param {string} baseURL the JSON-RPC URL of the node
   */
  static async create(baseURL: string): Promise<JSONRPCProvider> {
    const client = await Tm2Client.connect(baseURL);
    return new JSONRPCProvider(client);
  }
}
