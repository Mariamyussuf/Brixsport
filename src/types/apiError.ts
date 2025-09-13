

// Import core types
import { MatchEvent } from '@/types/matchTracker';


export interface ApiError {
  success: boolean;
  message: string;
  code?: string | number;
  status?: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

export const isValidationError = (error: any): error is ApiError & { errors: Record<string, string[]> } => {
  return error && 'errors' in error && typeof error.errors === 'object';
};

// Type guard to check if an error is an ApiError
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'success' in error && 'message' in error;
};

// Utility function to handle API errors
export const handleApiError = (error: any): void => {
  // Create a standardized error object
  const apiError: ApiError = {
    success: false,
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    status: error.status || 500,
    timestamp: new Date().toISOString()
  };
  
  // If it's already an API error with validation errors, include them
  if (isValidationError(error)) {
    apiError.errors = error.errors;
  }
  
  // Log error to console
  console.error('API Error:', apiError);
  
  // Re-throw the standardized error
  throw apiError;
};