import { apiGatewayService, generateAPIKey, createAPIKey } from '../../../services/security/api-gateway.service';

// Mock Redis service
jest.mock('../../../services/redis.service', () => ({
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn()
  }
}));

describe('API Gateway Service', () => {
  describe('generateAPIKey', () => {
    it('should generate a valid API key', () => {
      const apiKey = generateAPIKey();
      
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(32); // UUID + random string
    });

    it('should generate unique API keys', () => {
      const key1 = generateAPIKey();
      const key2 = generateAPIKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('createAPIKey', () => {
    it('should create an API key with correct properties', async () => {
      const apiKey = await createAPIKey(
        'user123',
        'Test API Key',
        ['read', 'write'],
        1000
      );
      
      expect(apiKey).toBeDefined();
      expect(apiKey.id).toBeDefined();
      expect(apiKey.key).toBeDefined();
      expect(apiKey.userId).toBe('user123');
      expect(apiKey.name).toBe('Test API Key');
      expect(apiKey.permissions).toEqual(['read', 'write']);
      expect(apiKey.rateLimit).toBe(1000);
      expect(apiKey.createdAt).toBeDefined();
    });
  });

  describe('rateLimitByAPIKey', () => {
    it('should return a rate limiting middleware function', () => {
      const middleware = apiGatewayService.rateLimitByAPIKey();
      
      expect(typeof middleware).toBe('function');
    });
  });

  describe('validateAPIKey', () => {
    it('should return a validation middleware function', () => {
      const middleware = apiGatewayService.validateAPIKey();
      
      expect(typeof middleware).toBe('function');
    });
  });

  describe('logAPIUsage', () => {
    it('should return a logging middleware function', () => {
      const middleware = apiGatewayService.logAPIUsage();
      
      expect(typeof middleware).toBe('function');
    });
  });

  describe('blockMaliciousRequests', () => {
    it('should return a blocking middleware function', () => {
      const middleware = apiGatewayService.blockMaliciousRequests();
      
      expect(typeof middleware).toBe('function');
    });
  });
});