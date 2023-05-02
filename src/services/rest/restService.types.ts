import { AxiosRequestConfig } from 'axios';
import { RPCRequest } from '../../provider';

export interface RequestParams {
  request: RPCRequest;
  config?: AxiosRequestConfig;
}
