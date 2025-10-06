import { Request, Response } from 'express';
import { rateLimiter } from '../../middleware/rateLimiter.middleware';

// Mock Redis service
jest.mock('../../services/redis.service', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    exists: jest.fn()
  }
}));

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      method: 'GET',
      url: '/test'
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow requests under the limit', async () => {
    const middleware = rateLimiter(5, 60000); // 5 requests per minute
    
    await middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should block requests over the limit', async () => {
    const middleware = rateLimiter(1, 60000); // 1 request per minute
    
    // Make first request
    await middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    // Make second request (should be blocked)
    await middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Too many requests',
      message: 'Too many requests, please try again later',
      retryAfter: expect.any(Number)
    });
  });

  it('should reset counter after window expires', async () => {
    jest.useFakeTimers();
    
    const middleware = rateLimiter(1, 1000); // 1 request per second
    
    // Make first request
    await middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    // Advance time by 1 second
    jest.advanceTimersByTime(1001);
    
    // Make second request (should be allowed)
    await middleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockResponse.status).not.toHaveBeenCalledWith(429);
    
    jest.useRealTimers();
  });

  it('should use different counters for different IPs', async () => {
    const middleware = rateLimiter(1, 60000); // 1 request per minute
    
    const request1 = { ...mockRequest, ip: '127.0.0.1' };
    const request2 = { ...mockRequest, ip: '127.0.0.2' };
    
    // Make request from first IP
    await middleware(
      request1 as Request,
      mockResponse as Response,
      mockNext
    );
    
    // Make request from second IP (should be allowed)
    await middleware(
      request2 as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});