import { logger } from '../utils/logger';

// Custom error classes
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

// Error handler service
export const errorHandlerService = {
  // Handle known errors
  handleKnownError: (error: AppError) => {
    logger.error('Known error occurred', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.constructor.name,
      message: error.message,
      statusCode: error.statusCode
    };
  },
  
  // Handle unknown errors
  handleUnknownError: (error: any) => {
    logger.error('Unknown error occurred', {
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: 500
    };
  },
  
  // Handle Supabase errors
  handleSupabaseError: (error: any) => {
    logger.error('Supabase error occurred', {
      message: error.message,
      details: error.details
    });
    
    // Map Supabase errors to our error types
    if (error.code === 'PGRST116') {
      return new NotFoundError('Resource not found');
    }
    
    return new InternalServerError(`Database error: ${error.message}`);
  },
  
  // Handle Zod validation errors
  handleZodError: (error: any) => {
    logger.error('Validation error occurred', {
      message: error.message,
      errors: error.errors
    });
    
    const validationErrors = error.errors.map((err: any) => ({
      path: err.path.join('.'),
      message: err.message
    }));
    
    return {
      success: false,
      error: 'ValidationError',
      message: 'Validation failed',
      details: validationErrors,
      statusCode: 400
    };
  },
  
  // Create error response
  createErrorResponse: (error: any) => {
    // Handle our custom errors
    if (error instanceof AppError) {
      return errorHandlerService.handleKnownError(error);
    }
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return errorHandlerService.handleZodError(error);
    }
    
    // Handle Supabase errors
    if (error.name === 'PostgrestError') {
      const appError = errorHandlerService.handleSupabaseError(error);
      return errorHandlerService.handleKnownError(appError);
    }
    
    // Handle unknown errors
    return errorHandlerService.handleUnknownError(error);
  }
};