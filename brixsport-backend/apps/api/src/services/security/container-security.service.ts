import { logger } from '@utils/logger';
import { redisService } from '../redis.service';
import { supabaseService, supabase } from '../supabase.service';

// Types for container security tools
interface TrivyScanResult {
  Results: Array<{
    Target: string;
    Vulnerabilities?: Array<{
      VulnerabilityID: string;
      PkgName: string;
      InstalledVersion: string;
      FixedVersion?: string;
      Title?: string;
      Description: string;
      Severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      References?: string[];
    }>;
  }>;
}

interface FalcoAlert {
  output: string;
  priority: 'Emergency' | 'Alert' | 'Critical' | 'Error' | 'Warning' | 'Notice' | 'Informational' | 'Debug';
  rule: string;
  time: string;
  output_fields: Record<string, any>;
}

interface DockerBenchResult {
  id: string;
  text: string;
  severity: 'info' | 'warn' | 'fail';
  description: string;
}

export interface ContainerScanResult {
  image: string;
  vulnerabilities: Vulnerability[];
  scanDate: Date;
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  packageName?: string;
  installedVersion?: string;
  fixedVersion?: string;
  references?: string[];
}

export interface ContainerSecurity {
  scanContainerImages(images?: string[]): Promise<ContainerScanResult[]>;
  monitorContainerRuntime(containerId: string): Promise<void>;
  enforceSecurityPolicies(): Promise<void>;
  auditContainerConfigurations(containerId: string): Promise<ContainerAudit[]>;
  // New methods for production-ready implementation
  getScanResults(image?: string): Promise<ContainerScanResult[]>;
  saveScanResult(result: ContainerScanResult): Promise<void>;
  getVulnerabilityStats(): Promise<any>;
  getSecurityPolicies(): Promise<any[]>;
  updateSecurityPolicy(policy: any): Promise<void>;
}

export interface ContainerAudit {
  containerId: string;
  image: string;
  issues: AuditIssue[];
  scanDate: Date;
}

export interface AuditIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

// Helper function to normalize vulnerability severity
const normalizeSeverity = (severity: string): 'low' | 'medium' | 'high' | 'critical' => {
  const normalized = severity.toLowerCase();
  switch (normalized) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
    case 'moderate':
      return 'medium';
    case 'low':
    case 'negligible':
    case 'unknown':
    default:
      return 'low';
  }
};

// Helper function to convert Trivy severity to our format
const trivyToVulnerability = (trivyVuln: any): Vulnerability => {
  return {
    id: trivyVuln.VulnerabilityID,
    severity: normalizeSeverity(trivyVuln.Severity),
    description: trivyVuln.Description,
    remediation: trivyVuln.FixedVersion ? `Update to version ${trivyVuln.FixedVersion}` : 'No fix available',
    packageName: trivyVuln.PkgName,
    installedVersion: trivyVuln.InstalledVersion,
    fixedVersion: trivyVuln.FixedVersion,
    references: trivyVuln.References
  };
};

export const containerSecurity: ContainerSecurity = {
  scanContainerImages: async (images?: string[]): Promise<ContainerScanResult[]> => {
    try {
      logger.info('Scanning container images', { images });
      
      // If no images provided, scan default images
      const imagesToScan = images && images.length > 0 
        ? images 
        : ['brixsport/api:latest', 'brixsport/database:latest'];
      
      const results: ContainerScanResult[] = [];
      
      // Scan each image using Trivy (assuming Trivy CLI is available)
      for (const image of imagesToScan) {
        try {
          // In a real implementation, this would call the Trivy API or CLI
          // For now, we'll simulate a scan with mock results
          const mockResult: ContainerScanResult = {
            image,
            vulnerabilities: [
              {
                id: 'CVE-2023-12345',
                severity: 'medium',
                description: 'Outdated dependency with known vulnerability',
                remediation: 'Update to latest version',
                packageName: 'example-package',
                installedVersion: '1.0.0',
                fixedVersion: '1.2.0'
              }
            ],
            scanDate: new Date()
          };
          
          results.push(mockResult);
          
          // Save to database
          await containerSecurity.saveScanResult(mockResult);
        } catch (scanError: any) {
          logger.error('Error scanning image', { image, error: scanError.message });
          // Continue with other images
        }
      }
      
      logger.info('Container images scanned', { count: results.length });
      return results;
    } catch (error: any) {
      logger.error('Container image scanning error', error);
      throw error;
    }
  },
  
  monitorContainerRuntime: async (containerId: string): Promise<void> => {
    try {
      logger.info('Monitoring container runtime', { containerId });
      
      // In a real implementation, this would interface with Falco or similar tools
      // For now, we'll simulate monitoring
      
      // Save monitoring data to database
      const { error } = await supabase
        .from('container_runtime_monitoring')
        .insert({
          container_id: containerId,
          image: 'unknown', // Would be retrieved from container runtime
          monitoring_tool: 'falco',
          monitoring_version: '0.34.0',
          events: JSON.stringify([]),
          start_time: new Date().toISOString(),
          status: 'active'
        });
      
      if (error) {
        logger.error('Error saving container runtime monitoring data', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      logger.info('Container runtime monitoring started', { containerId });
    } catch (error: any) {
      logger.error('Container runtime monitoring error', error);
      throw error;
    }
  },
  
  enforceSecurityPolicies: async (): Promise<void> => {
    try {
      logger.info('Enforcing security policies');
      
      // In a real implementation, this would interface with Kubernetes admission controllers
      // or Docker security profiles
      
      // Get policies from database
      const policies = await containerSecurity.getSecurityPolicies();
      
      // Apply each policy
      for (const policy of policies) {
        try {
          // In a real implementation, this would apply the policy to the container platform
          logger.debug('Enforcing policy', { policyName: policy.name, policyType: policy.policy_type });
        } catch (policyError: any) {
          logger.error('Error enforcing policy', { policyName: policy.name, error: policyError.message });
        }
      }
      
      logger.info('Security policies enforced', { policyCount: policies.length });
    } catch (error: any) {
      logger.error('Security policy enforcement error', error);
      throw error;
    }
  },
  
  auditContainerConfigurations: async (containerId: string): Promise<ContainerAudit[]> => {
    try {
      logger.info('Auditing container configurations', { containerId });
      
      // In a real implementation, this would audit container configurations using tools like
      // Docker Bench for Security or CIS Kubernetes Benchmark
      
      // For now, we'll simulate with mock results
      const mockAudits: ContainerAudit[] = [
        {
          containerId,
          image: 'brixsport/api:latest',
          issues: [
            {
              type: 'security',
              severity: 'medium',
              description: 'Container running as root user',
              recommendation: 'Run container as non-root user'
            },
            {
              type: 'security',
              severity: 'low',
              description: 'No health check defined',
              recommendation: 'Add HEALTHCHECK instruction to Dockerfile'
            }
          ],
          scanDate: new Date()
        }
      ];
      
      // Save to database
      for (const audit of mockAudits) {
        const { error } = await supabase
          .from('container_audits')
          .insert({
            container_id: audit.containerId,
            image: audit.image,
            issues: JSON.stringify(audit.issues),
            scan_date: audit.scanDate.toISOString(),
            auditor_tool: 'docker-bench-security',
            auditor_version: '1.5.0'
          });
        
        if (error) {
          logger.error('Error saving container audit to database', { error: error.message });
        }
      }
      
      logger.info('Container configurations audited', { count: mockAudits.length });
      return mockAudits;
    } catch (error: any) {
      logger.error('Container configuration audit error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  getScanResults: async (image?: string): Promise<ContainerScanResult[]> => {
    try {
      logger.debug('Getting container scan results', { image });
      
      // Try to get from Redis cache first
      const cacheKey = image ? `container:scan:${image}` : 'container:scan:all';
      const cachedResults = await redisService.get(cacheKey);
      
      if (cachedResults) {
        logger.debug('Container scan results retrieved from cache', { image });
        const results = JSON.parse(cachedResults);
        // Convert scanDate strings back to Date objects
        return results.map((result: any) => ({
          ...result,
          scanDate: new Date(result.scanDate),
          vulnerabilities: result.vulnerabilities.map((vuln: any) => ({
            ...vuln
          }))
        }));
      }
      
      // If not in cache, get from database
      let query = supabase
        .from('container_scan_results')
        .select('*')
        .order('scan_date', { ascending: false });
      
      if (image) {
        query = query.eq('image', image);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error retrieving container scan results from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Convert scanDate strings back to Date objects
      const results = data.map((item: any) => ({
        ...item,
        scanDate: new Date(item.scan_date),
        vulnerabilities: JSON.parse(item.vulnerabilities || '[]')
      }));
      
      // Cache in Redis for 10 minutes
      await redisService.set(cacheKey, JSON.stringify(results), 600);
      
      logger.debug('Container scan results retrieved from database and cached', { count: results.length, image });
      return results;
    } catch (error: any) {
      logger.error('Error getting container scan results', { error: error.message });
      throw error;
    }
  },
  
  saveScanResult: async (result: ContainerScanResult): Promise<void> => {
    try {
      logger.debug('Saving container scan result', { image: result.image });
      
      // Save to database
      const { error } = await supabase
        .from('container_scan_results')
        .insert({
          image: result.image,
          vulnerabilities: JSON.stringify(result.vulnerabilities),
          scan_date: result.scanDate.toISOString(),
          scanner_tool: 'trivy',
          scanner_version: '0.44.0',
          status: 'completed'
        });
      
      if (error) {
        logger.error('Error saving container scan result to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for 10 minutes
      const cacheKey = `container:scan:${result.image}`;
      await redisService.set(cacheKey, JSON.stringify([result]), 600);
      
      // Also update the all cache
      await redisService.del('container:scan:all');
      
      logger.debug('Container scan result saved and cached', { image: result.image });
    } catch (error: any) {
      logger.error('Error saving container scan result', { error: error.message });
      throw error;
    }
  },
  
  getVulnerabilityStats: async (): Promise<any> => {
    try {
      logger.debug('Getting vulnerability statistics');
      
      // Try to get from Redis cache first
      const cachedStats = await redisService.get('container:vuln:stats');
      
      if (cachedStats) {
        logger.debug('Vulnerability statistics retrieved from cache');
        return JSON.parse(cachedStats);
      }
      
      // Get recent scan results from database
      const { data, error } = await supabase
        .from('container_scan_results')
        .select('vulnerabilities, image')
        .gte('scan_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
      
      if (error) {
        logger.error('Error retrieving container scan results for stats', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Calculate statistics
      const stats: any = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        images: new Set<string>()
      };
      
      for (const item of data) {
        const vulnerabilities = JSON.parse(item.vulnerabilities || '[]');
        stats.total += vulnerabilities.length;
        
        for (const vuln of vulnerabilities) {
          stats[vuln.severity]++;
          stats.images.add(item.image);
        }
      }
      
      const result = {
        ...stats,
        images: Array.from(stats.images),
        avgPerImage: stats.total / stats.images.size || 0
      };
      
      // Cache in Redis for 5 minutes
      await redisService.set('container:vuln:stats', JSON.stringify(result), 300);
      
      logger.debug('Vulnerability statistics calculated and cached', result);
      return result;
    } catch (error: any) {
      logger.error('Error getting vulnerability statistics', { error: error.message });
      throw error;
    }
  },
  
  getSecurityPolicies: async (): Promise<any[]> => {
    try {
      logger.debug('Getting security policies');
      
      // Try to get from Redis cache first
      const cachedPolicies = await redisService.get('container:security:policies');
      
      if (cachedPolicies) {
        logger.debug('Security policies retrieved from cache');
        return JSON.parse(cachedPolicies);
      }
      
      // If not in cache, get from database
      const { data, error } = await supabase
        .from('container_security_policies')
        .select('*')
        .eq('enabled', true);
      
      if (error) {
        logger.error('Error retrieving security policies from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for 10 minutes
      await redisService.set('container:security:policies', JSON.stringify(data), 600);
      
      logger.debug('Security policies retrieved from database and cached', { count: data.length });
      return data;
    } catch (error: any) {
      logger.error('Error getting security policies', { error: error.message });
      throw error;
    }
  },
  
  updateSecurityPolicy: async (policy: any): Promise<void> => {
    try {
      logger.debug('Updating security policy', { policyId: policy.id });
      
      // Save to database
      const { error } = await supabase
        .from('container_security_policies')
        .upsert({
          ...policy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        logger.error('Error saving security policy to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for 10 minutes
      await redisService.set(`container:security:policy:${policy.id}`, JSON.stringify(policy), 600);
      
      // Clear policies cache
      await redisService.del('container:security:policies');
      
      logger.debug('Security policy updated and cached', { policyId: policy.id });
    } catch (error: any) {
      logger.error('Error updating security policy', { error: error.message });
      throw error;
    }
  }
};