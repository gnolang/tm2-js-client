import axios from 'axios';
import { RequestParams } from './restService.types';
import { RPCResponse } from '../../provider/types/jsonrpc';

export class RestService {
  static async post<TResult>(
    baseURL: string,
    params: RequestParams
  ): Promise<TResult> {
    const axiosResponse = await axios.post<RPCResponse<TResult>>(
      baseURL,
      params.request,
      params.config
    );

    const { result, error } = axiosResponse.data;

    // Check for errors
    if (error) {
      // Error encountered during the POST request
      throw new Error(`${error.message}: ${error.data}`);
    }

    // Check for the correct result format
    if (!result) {
      throw new Error('invalid result returned');
    }

    return result;
  }
}
