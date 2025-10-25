import { APIEndpoint, APIResponse } from '@/types/api';
import ErrorHandler from '@/lib/errorHandler';

import { databaseService } from '@/lib/databaseService';

// APIService that uses databaseService for actual data operations
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
      // Route requests based on endpoint to appropriate database service methods
      switch (endpoint.url) {
        case '/competitions':
          if (endpoint.method === 'GET') {
            const competitions = await databaseService.getCompetitions();
            return { success: true, data: competitions as unknown as T };
          } else if (endpoint.method === 'POST') {
            const competition = await databaseService.createCompetition(data);
            return { success: true, data: competition as unknown as T };
          }
          break;
        case /^\/competitions\/\d+$/.test(endpoint.url) ? endpoint.url : null:
          if (endpoint.method === 'GET') {
            const id = parseInt(endpoint.url.split('/')[2]);
            const competition = await databaseService.getCompetitionById(id);
            return { success: true, data: competition as unknown as T };
          } else if (endpoint.method === 'PUT') {
            const id = parseInt(endpoint.url.split('/')[2]);
            const competition = await databaseService.updateCompetition(id, data);
            return { success: true, data: competition as unknown as T };
          } else if (endpoint.method === 'DELETE') {
            const id = parseInt(endpoint.url.split('/')[2]);
            const success = await databaseService.deleteCompetition(id);
            return { success: success, data: undefined };
          }
          break;
        case '/matches':
          if (endpoint.method === 'GET') {
            const matches = await databaseService.getMatches();
            return { success: true, data: matches as unknown as T };
          } else if (endpoint.method === 'POST') {
            const match = await databaseService.createMatch(data);
            return { success: true, data: match as unknown as T };
          }
          break;
        case '/admin/loggers':
          if (endpoint.method === 'GET') {
            const loggers = await databaseService.getAllLoggers();
            return { success: true, data: loggers as unknown as T };
          } else if (endpoint.method === 'POST') {
            const logger = await databaseService.createLogger(data);
            return { success: true, data: logger as unknown as T };
          }
          break;
        // Add more endpoints as needed
        default:
          throw new Error(`Unsupported endpoint: ${endpoint.url}`);
      }
      
      throw new Error(`Unsupported method ${endpoint.method} for ${endpoint.url}`);
    } catch (error: any) {
      // Normalize errors via ErrorHandler
      const handledError = ErrorHandler.handle(error, `API request to ${endpoint.url} failed`);
      return { success: false, error: handledError };
    }
  }
}

export default APIService.getInstance();