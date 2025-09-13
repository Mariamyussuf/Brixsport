import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { APIEndpoint, APIResponse } from '@/types/api';
import ErrorHandler from '@/lib/errorHandler';
import { API_BASE_URL, API_TIMEOUT } from '@/lib/apiConfig';

class APIService {
  private static instance: APIService;

  private constructor() {}

  public static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  public async request<T>(
    endpoint: APIEndpoint<T>,
    data?: any,
    params?: any,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<T>> {
    const config: AxiosRequestConfig = {
      method: endpoint.method,
      url: `${API_BASE_URL}${endpoint.url}`,
      data,
      params,
      timeout: API_TIMEOUT,
      signal: options?.signal,
    };

    // Attach auth header when provided
    if (options?.authToken) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${options.authToken}`,
      };
    }

    try {
      const response: AxiosResponse = await axios(config);
      const responseData = endpoint.transform ? endpoint.transform(response.data) : response.data;
      return { success: true, data: responseData };
    } catch (error: any) {
      // Normalize axios errors into our StandardizedError via ErrorHandler
      const handledError = ErrorHandler.handle(error, `API request to ${endpoint.url} failed`);
      return { success: false, error: handledError };
    }
  }
}

export default APIService.getInstance();
