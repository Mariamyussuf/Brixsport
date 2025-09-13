import { ValidationError } from './validationUtils';

// Standardized error interface
export interface StandardizedError {
  success: boolean;
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]> | ValidationError[];
  timestamp?: string;
}

// Type guard for API errors
export function isApiError(error: any): error is StandardizedError {
  return error && typeof error === 'object' && 'success' in error && 'message' in error;
}

// Type guard for validation errors
export function isValidationError(error: any): error is StandardizedError & { errors: ValidationError[] } {
  return isApiError(error) && 'errors' in error && Array.isArray(error.errors);
}

// Network error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN'
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Validation failed. Please check your input and try again.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  NOT_FOUND: 'Resource not found.',
  FORBIDDEN: 'Access forbidden. You do not have permission to perform this action.'
};

// Enhanced error handler
export class ErrorHandler {
  static handle(error: any, context: string = ''): StandardizedError {
    // If it's already a standardized error, return it
    if (isApiError(error)) {
      // Log and return
      ErrorHandler.logError(error, context);
      return error;
    }

    // Axios error shape: error.isAxiosError and error.response
    if (error && error.isAxiosError) {
      const status = error.response?.status ?? 500;
      const message = error.response?.data?.message || error.message || ERROR_MESSAGES.SERVER_ERROR;
      const code = error.response?.data?.code || ERROR_CODES.SERVER_ERROR;

      const standardized: StandardizedError = {
        success: false,
        message,
        code,
        status,
        timestamp: new Date().toISOString(),
      };

      ErrorHandler.logError({ error, standardized }, context || `Axios request failed (status ${status})`);
      return standardized;
    }

    // Handle network errors (fetch)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const standardized: StandardizedError = {
        success: false,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        code: ERROR_CODES.NETWORK_ERROR,
        status: 0,
        timestamp: new Date().toISOString()
      };
      ErrorHandler.logError({ error, standardized }, context || 'Network error');
      return standardized;
    }

    // Handle timeout errors (Abort)
    if (error instanceof Error && error.name === 'AbortError') {
      const standardized: StandardizedError = {
        success: false,
        message: ERROR_MESSAGES.TIMEOUT_ERROR,
        code: ERROR_CODES.TIMEOUT_ERROR,
        status: 408,
        timestamp: new Date().toISOString()
      };
      ErrorHandler.logError({ error, standardized }, context || 'Request aborted');
      return standardized;
    }

    // Handle HTTP Response (fetch Response)
    if (error instanceof Response) {
      const standardized: StandardizedError = {
        success: false,
        message: error.statusText || ERROR_MESSAGES.SERVER_ERROR,
        code: ERROR_CODES.SERVER_ERROR,
        status: error.status,
        timestamp: new Date().toISOString()
      };
      ErrorHandler.logError({ error, standardized }, context || `HTTP error ${error.status}`);
      return standardized;
    }

    // Handle generic errors
    const standardized: StandardizedError = {
      success: false,
      message: error?.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
      timestamp: new Date().toISOString()
    };

    ErrorHandler.logError({ error, standardized }, context || 'Unknown error');
    return standardized;
  }

  // Create validation error
  static createValidationError(errors: ValidationError[]): StandardizedError {
    return {
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR,
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  // Create network error
  static createNetworkError(): StandardizedError {
    return {
      success: false,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      code: ERROR_CODES.NETWORK_ERROR,
      status: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Create timeout error
  static createTimeoutError(): StandardizedError {
    return {
      success: false,
      message: ERROR_MESSAGES.TIMEOUT_ERROR,
      code: ERROR_CODES.TIMEOUT_ERROR,
      status: 408,
      timestamp: new Date().toISOString()
    };
  }

  // Create authentication error
  static createAuthError(): StandardizedError {
    return {
      success: false,
      message: ERROR_MESSAGES.AUTH_ERROR,
      code: ERROR_CODES.AUTH_ERROR,
      status: 401,
      timestamp: new Date().toISOString()
    };
  }

  // Log error for debugging
  static logError(error: any, context: string = ''): void {
    console.error(`[${new Date().toISOString()}] ${context}`, error);
    
    // In production, you might want to send this to a logging service
    // Example: sendToLoggingService(error, context);
  }

  // Format error for user display
  static formatForUser(error: StandardizedError): string {
    if (isValidationError(error) && error.errors) {
      // Format validation errors
      if (Array.isArray(error.errors)) {
        return error.errors.map(e => e.message).join(', ');
      } else {
        // Handle object-style validation errors
        return Object.values(error.errors).flat().join(', ');
      }
    }
    
    return error.message;
  }
}

// Hook for React components to handle errors
export function useErrorHandler() {
  const handleError = (error: any, context: string = ''): StandardizedError => {
    const standardizedError = ErrorHandler.handle(error);
    ErrorHandler.logError(standardizedError, context);
    return standardizedError;
  };

  const formatErrorForUser = (error: StandardizedError): string => {
    return ErrorHandler.formatForUser(error);
  };

  return {
    handleError,
    formatErrorForUser
  };
}

export default ErrorHandler;