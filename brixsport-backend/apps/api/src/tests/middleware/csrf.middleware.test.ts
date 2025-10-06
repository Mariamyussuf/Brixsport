import { Request, Response } from 'express';
import { csrfGuard, csrfTokenMiddleware } from '../../middleware/csrf.middleware';

// Mock Redis service
jest.mock('../../services/redis.service', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

describe('CSRF Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response> & { locals: any };
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      query: {},
      cookies: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      locals: {}
    };
    
    mockNext = jest.fn();
    
    // Mock session
    (mockRequest as any).session = { id: 'test-session-id' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a CSRF token', async () => {
      const token = await csrfGuard.generateToken(mockRequest as Request);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(36); // UUID length
    });
  });

  describe('validateToken', () => {
    it('should validate a correct CSRF token', async () => {
      const token = await csrfGuard.generateToken(mockRequest as Request);
      const isValid = await csrfGuard.validateToken(mockRequest as Request, token);
      
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect CSRF token', async () => {
      await csrfGuard.generateToken(mockRequest as Request);
      const isValid = await csrfGuard.validateToken(mockRequest as Request, 'invalid-token');
      
      expect(isValid).toBe(false);
    });

    it('should reject validation when no token exists', async () => {
      const isValid = await csrfGuard.validateToken(mockRequest as Request, 'any-token');
      
      expect(isValid).toBe(false);
    });
  });

  describe('csrfProtection', () => {
    it('should allow safe HTTP methods without token', async () => {
      const middleware = csrfGuard.csrfProtection();
      mockRequest.method = 'GET';
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block unsafe methods without token', async () => {
      const middleware = csrfGuard.csrfProtection();
      mockRequest.method = 'POST';
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'CSRF token required',
        message: 'A valid CSRF token is required for this request'
      });
    });

    it('should allow unsafe methods with valid token', async () => {
      const middleware = csrfGuard.csrfProtection();
      mockRequest.method = 'POST';
      
      // Generate and set a valid token
      const token = await csrfGuard.generateToken(mockRequest as Request);
      mockRequest.headers = { 'x-csrf-token': token };
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('csrfTokenMiddleware', () => {
    it('should generate token and set cookie', async () => {
      await csrfTokenMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.locals.csrfToken).toBeDefined();
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        '_csrf',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          secure: expect.any(Boolean),
          sameSite: 'strict'
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });
});