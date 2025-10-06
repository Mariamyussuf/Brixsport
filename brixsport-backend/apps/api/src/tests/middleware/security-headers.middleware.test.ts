import { Request, Response } from 'express';
import { securityHeadersMiddleware } from '../../middleware/security-headers.middleware';

describe('Security Headers Middleware', () => {
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
      set: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      removeHeader: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('configureCSP', () => {
    it('should configure CSP with provided directives', () => {
      const cspConfig = {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"]
        }
      };
      
      const middleware = securityHeadersMiddleware.configureCSP(cspConfig);
      
      expect(typeof middleware).toBe('function');
    });
  });

  describe('configureReferrerPolicy', () => {
    it('should configure referrer policy', () => {
      const middleware = securityHeadersMiddleware.configureReferrerPolicy('strict-origin-when-cross-origin');
      
      expect(typeof middleware).toBe('function');
    });
  });

  describe('enhancedSecurityHeaders', () => {
    it('should return an array of middleware functions', () => {
      const middlewareArray = securityHeadersMiddleware.enhancedSecurityHeaders();
      
      expect(Array.isArray(middlewareArray)).toBe(true);
      expect(middlewareArray.length).toBeGreaterThan(0);
    });

    it('should set security headers when middleware is executed', () => {
      const middlewareArray = securityHeadersMiddleware.enhancedSecurityHeaders();
      const helmetMiddleware = middlewareArray[0];
      const additionalHeadersMiddleware = middlewareArray[1];
      
      // Execute the additional headers middleware
      additionalHeadersMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy', 
        'strict-origin-when-cross-origin'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy', 
        'geolocation=(), microphone=(), camera=()'
      );
      expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});