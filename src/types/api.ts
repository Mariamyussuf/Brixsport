import { Method } from 'axios';

export interface APIEndpoint<T = any> {
  url: string;
  method: Method;
  requiresAuth?: boolean;
  cache?: {
    ttl: number;
  };
  transform?: (data: any) => T;
}

export interface APIError {
  message: string;
  code?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}
