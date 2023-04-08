import { AxiosRequestConfig } from 'axios';
import { RPCRequest } from '../../provider/spec/jsonrpc';

export interface RequestParams {
  request: RPCRequest;
  config?: AxiosRequestConfig;
}
