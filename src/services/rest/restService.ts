import axios from 'axios';
import { RequestParams } from './restService.types';

export class RestService {
  static async post<T>(baseURL: string, params: RequestParams) {
    return axios
      .post<T>(`${baseURL}/${params.url}`, params.data, params.config)
      .then((response) => response.data);
  }

  static async get<T>(baseURL: string, params: Omit<RequestParams, 'data'>) {
    return axios
      .get<T>(`${baseURL}/${params.url}`, {
        params: params.config,
      })
      .then((response) => response.data);
  }
}
