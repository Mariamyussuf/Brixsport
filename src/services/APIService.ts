import { APIEndpoint, APIResponse } from '@/types/api';
import ErrorHandler from '@/lib/errorHandler';

// Mock APIService that uses databaseService instead of actual API calls
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
    try {
      // For now, return a mock response as this needs backend implementation
      // In a real implementation, this would fetch from the database service
      return {
        success: true,
        data: {} as T // Return empty data as placeholder
      };
    } catch (error: any) {
      // Normalize errors via ErrorHandler
      const handledError = ErrorHandler.handle(error, `API request to ${endpoint.url} failed`);
      return { success: false, error: handledError };
    }
  }
}

export default APIService.getInstance();