import { Request, Response } from 'express';
import { ddosProtection } from '../../middleware/ddos.middleware';

// Mock Redis service
jest.mock('../../services/redis.service', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
    hset: jest.fn(),
    sadd: jest.fn()
  }
}));

describe('DDoS Protection Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: {},
      query: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {}
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    
    // Clear in-memory storage
    const blockedIPs = require('../../middleware/ddos.middleware').blockedIPs;
    const ipRequests = require('../../middleware/ddos.middleware').ipRequests;
    const userAgentStats = require('../../middleware/ddos.middleware').userAgentStats;
    
    // Clear the objects
    Object.keys(blockedIPs).forEach(key => delete blockedIPs[key]);
    Object.keys(ipRequests).forEach(key => delete ipRequests[key]);
    Object.keys(userAgentStats).forEach(key => delete userAgentStats[key]);
  });

  describe('detectDDoS', () => {
    it('should track requests per IP', async () => {
      const middleware = ddosProtection.detectDDoS();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block IP when request rate exceeds threshold', async () => {
      // Set a low threshold for testing
      process.env.DDOS_RPM_THRESHOLD = '1';
      
      const middleware = ddosProtection.detectDDoS();
      const testRequest = {
        ...mockRequest,
        ip: '192.168.1.100'
      };
      
      // Make first request
      await middleware(
        testRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Make second request (should trigger blocking)
      await middleware(
        testRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Check that IP is now blocked
      const blockedIPs = require('../../middleware/ddos.middleware').blockedIPs;
      expect(blockedIPs[testRequest.ip as string]).toBeDefined();
    });
  });

  describe('blockMaliciousIPs', () => {
    it('should allow requests from non-blocked IPs', async () => {
      const middleware = ddosProtection.blockMaliciousIPs();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests from blocked IPs', async () => {
      const middleware = ddosProtection.blockMaliciousIPs();
      const testRequest = {
        ...mockRequest,
        ip: '192.168.1.100'
      };
      
      // Manually block the IP
      const blockedIPs = require('../../middleware/ddos.middleware').blockedIPs;
      blockedIPs[testRequest.ip as string] = Date.now() + 300000; // Block for 5 minutes
      
      await middleware(
        testRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      });
    });
  });

  describe('challengeSuspiciousRequests', () => {
    it('should allow normal requests', async () => {
      const middleware = ddosProtection.challengeSuspiciousRequests();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests with suspicious patterns', async () => {
      const middleware = ddosProtection.challengeSuspiciousRequests();
      const testRequest = {
        ...mockRequest,
        url: '/test?param=SELECT * FROM users'
      };
      
      await middleware(
        testRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Request blocked for security reasons'
      });
    });

    it('should block requests with excessive parameters', async () => {
      const middleware = ddosProtection.challengeSuspiciousRequests();
      
      // Create request with excessive parameters
      const testQuery: any = {};
      for (let i = 0; i < 150; i++) {
        testQuery[`param${i}`] = `value${i}`;
      }
      
      const testRequest = {
        ...mockRequest,
        query: testQuery
      };
      
      await middleware(
        testRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request',
        message: 'Request contains too many parameters'
      });
    });
  });

  describe('userAgentAnalysis', () => {
    it('should allow normal user agents', async () => {
      const middleware = ddosProtection.userAgentAnalysis();
      
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block suspicious user agents', async () => {
      const middleware = ddosProtection.userAgentAnalysis();
      const testRequest = {
        ...mockRequest,
        headers: {
          'user-agent': 'sqlmap/1.4.5'
        }
      };
      
      await middleware(
        testRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'Access denied'
      });
    });
  });
});