import { containerSecurity } from './container-security.service';

// Mock the logger
jest.mock('@utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock the redis service
jest.mock('../redis.service', () => ({
  redisService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }
}));

// Mock the supabase service
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  range: jest.fn().mockReturnThis(),
};

jest.mock('../supabase.service', () => ({
  supabase: mockSupabase,
  supabaseService: {
    // Add any methods that might be used from supabaseService
  }
}));

describe('ContainerSecurity Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scanContainerImages', () => {
    it('should scan container images and return results', async () => {
      const results = await containerSecurity.scanContainerImages(['test-image:latest']);
      
      expect(results).toHaveLength(1);
      expect(results[0].image).toBe('test-image:latest');
      expect(results[0].vulnerabilities).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('container_scan_results');
    });

    it('should scan default images when none provided', async () => {
      const results = await containerSecurity.scanContainerImages();
      
      expect(results).toHaveLength(2);
      expect(results[0].image).toBe('brixsport/api:latest');
      expect(results[1].image).toBe('brixsport/database:latest');
    });
  });

  describe('monitorContainerRuntime', () => {
    it('should monitor container runtime', async () => {
      await containerSecurity.monitorContainerRuntime('test-container-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('container_runtime_monitoring');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('enforceSecurityPolicies', () => {
    it('should enforce security policies', async () => {
      // Mock the getSecurityPolicies method to return some policies
      const mockPolicies = [
        { id: '1', name: 'test-policy', policy_type: 'kubernetes' }
      ];
      
      // Mock the implementation of getSecurityPolicies
      containerSecurity.getSecurityPolicies = jest.fn().mockResolvedValue(mockPolicies);
      
      await containerSecurity.enforceSecurityPolicies();
      
      expect(containerSecurity.getSecurityPolicies).toHaveBeenCalled();
    });
  });

  describe('auditContainerConfigurations', () => {
    it('should audit container configurations', async () => {
      const audits = await containerSecurity.auditContainerConfigurations('test-container-123');
      
      expect(audits).toHaveLength(1);
      expect(audits[0].containerId).toBe('test-container-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('container_audits');
    });
  });

  describe('getScanResults', () => {
    it('should get scan results from database when not cached', async () => {
      const mockData = [
        {
          image: 'test-image:latest',
          vulnerabilities: '[]',
          scan_date: new Date().toISOString()
        }
      ];
      
      mockSupabase.select = jest.fn().mockReturnThis();
      mockSupabase.order = jest.fn().mockReturnThis();
      mockSupabase.eq = jest.fn().mockReturnThis();
      
      // Mock the final query result
      const mockQuery = {
        select: mockSupabase.select,
        order: mockSupabase.order,
        eq: mockSupabase.eq,
      };
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);
      
      // Mock the final result
      (mockQuery as any).then = jest.fn().mockResolvedValue({ data: mockData, error: null });
      
      const results = await containerSecurity.getScanResults('test-image:latest');
      
      expect(results).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('container_scan_results');
    });
  });

  describe('saveScanResult', () => {
    it('should save scan result to database', async () => {
      const mockResult = {
        image: 'test-image:latest',
        vulnerabilities: [],
        scanDate: new Date()
      };
      
      await containerSecurity.saveScanResult(mockResult);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('container_scan_results');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('getVulnerabilityStats', () => {
    it('should get vulnerability statistics', async () => {
      const mockData = [
        {
          vulnerabilities: '[]',
          image: 'test-image:latest'
        }
      ];
      
      mockSupabase.select = jest.fn().mockReturnThis();
      mockSupabase.gte = jest.fn().mockReturnThis();
      
      // Mock the final query result
      const mockQuery = {
        select: mockSupabase.select,
        gte: mockSupabase.gte,
      };
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);
      
      // Mock the final result
      (mockQuery as any).then = jest.fn().mockResolvedValue({ data: mockData, error: null });
      
      const stats = await containerSecurity.getVulnerabilityStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('critical');
      expect(stats).toHaveProperty('high');
      expect(stats).toHaveProperty('medium');
      expect(stats).toHaveProperty('low');
      expect(mockSupabase.from).toHaveBeenCalledWith('container_scan_results');
    });
  });

  describe('getSecurityPolicies', () => {
    it('should get security policies from database when not cached', async () => {
      const mockData = [
        {
          id: '1',
          name: 'test-policy',
          description: 'Test policy',
          policy_type: 'kubernetes',
          policy_data: '{}',
          enabled: true
        }
      ];
      
      mockSupabase.select = jest.fn().mockReturnThis();
      mockSupabase.eq = jest.fn().mockReturnThis();
      
      // Mock the final query result
      const mockQuery = {
        select: mockSupabase.select,
        eq: mockSupabase.eq,
      };
      
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);
      
      // Mock the final result
      (mockQuery as any).then = jest.fn().mockResolvedValue({ data: mockData, error: null });
      
      const policies = await containerSecurity.getSecurityPolicies();
      
      expect(policies).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('container_security_policies');
    });
  });

  describe('updateSecurityPolicy', () => {
    it('should update security policy in database', async () => {
      const mockPolicy = {
        id: '1',
        name: 'updated-policy',
        description: 'Updated policy',
        policy_type: 'kubernetes',
        policy_data: '{}',
        enabled: true
      };
      
      await containerSecurity.updateSecurityPolicy(mockPolicy);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('container_security_policies');
      expect(mockSupabase.upsert).toHaveBeenCalled();
    });
  });
});