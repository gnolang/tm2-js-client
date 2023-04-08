import axios from 'axios';
import { RequestParams } from './restService.types';
import { RPCResponse } from '../../provider/spec/jsonrpc';

export class RestService {
  static async post<TResult, TError>(
    baseURL: string,
    params: RequestParams
  ): Promise<RPCResponse<TResult, TError>> {
    return axios
      .post<RPCResponse<TResult, TError>>(
        baseURL,
        params.request,
        params.config
      )
      .then((response) => response.data);
  }
}
