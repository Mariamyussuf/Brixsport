export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string) {
    super(message, 500, false);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400);
    this.name = 'ValidationError';
    if (details) {
      Object.assign(this, { details });
    }
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string) {
    super(message, 500, false);
    this.name = 'InternalServerError';
  }
}