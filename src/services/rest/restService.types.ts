import { AxiosRequestConfig } from 'axios';
import { RPCRequest } from '../../provider/types/jsonrpc';

export interface RequestParams {
  request: RPCRequest;
  config?: AxiosRequestConfig;
}
