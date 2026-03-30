import {
  AxiosRequestConfig,
} from "axios";

import {
  RPCRequest,
} from "../../provider/index.js";

export interface RequestParams {
  request: RPCRequest
  config?: AxiosRequestConfig
}
