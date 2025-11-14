import { logger } from '../utils/logger';

// CDN service for fast media delivery
// This service handles CDN integration for optimized media delivery

interface CDNConfig {
  provider: 'cloudflare' | 'aws-cloudfront' | 'azure-cdn' | 'google-cdn' | 'custom';
  baseUrl: string;
  apiKey?: string;
  zoneId?: string;
  domain?: string;
}

// Cloudflare API response types
interface CloudflarePurgeResponse {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
}

class CDNService {
  private config: CDNConfig;
  private isEnabled: boolean;

  constructor() {
    // Load CDN configuration from environment variables
    this.config = {
      provider: (process.env.CDN_PROVIDER as CDNConfig['provider']) || 'custom',
      baseUrl: process.env.CDN_BASE_URL || '',
      apiKey: process.env.CDN_API_KEY,
      zoneId: process.env.CDN_ZONE_ID,
      domain: process.env.CDN_DOMAIN
    };
    
    // CDN is enabled if base URL is configured
    this.isEnabled = !!this.config.baseUrl;
    
    if (this.isEnabled) {
      logger.info('CDN service initialized', { 
        provider: this.config.provider, 
        baseUrl: this.config.baseUrl,
        domain: this.config.domain
      });
    } else {
      logger.info('CDN service disabled - no base URL configured');
    }
  }

  // Check if CDN is enabled
  isCDNEnabled(): boolean {
    return this.isEnabled;
  }

  // Get CDN configuration
  getConfig(): CDNConfig {
    return { ...this.config };
  }

  // Generate CDN URL for a media file
  generateCDNUrl(filePath: string): string {
    // If CDN is not enabled, return the original URL
    if (!this.isEnabled || !this.config.baseUrl) {
      return filePath;
    }

    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Construct CDN URL
    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1) 
      : this.config.baseUrl;
      
    return `${baseUrl}/${cleanPath}`;
  }

  // Purge cache for a specific file
  async purgeFileCache(filePath: string): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        logger.debug('CDN purge skipped - CDN not enabled', { filePath });
        return true;
      }

      logger.info('Purging CDN cache for file', { filePath });

      // Implementation would depend on the CDN provider
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeCloudflareCache(filePath);
        case 'aws-cloudfront':
          return await this.purgeCloudFrontCache(filePath);
        case 'azure-cdn':
          return await this.purgeAzureCDNCache(filePath);
        case 'google-cdn':
          return await this.purgeGoogleCDNCache(filePath);
        default:
          // For custom CDN or when no specific implementation is available
          logger.warn('CDN purge not implemented for provider', { 
            provider: this.config.provider, 
            filePath 
          });
          return true;
      }
    } catch (error: any) {
      logger.error('CDN cache purge error', { 
        error: error.message, 
        filePath,
        provider: this.config.provider
      });
      return false;
    }
  }

  // Purge cache for multiple files
  async purgeMultipleFilesCache(filePaths: string[]): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        logger.debug('CDN purge skipped - CDN not enabled', { fileCount: filePaths.length });
        return true;
      }

      logger.info('Purging CDN cache for multiple files', { fileCount: filePaths.length });

      // Implementation would depend on the CDN provider
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeMultipleCloudflareCache(filePaths);
        case 'aws-cloudfront':
          return await this.purgeMultipleCloudFrontCache(filePaths);
        case 'azure-cdn':
          return await this.purgeMultipleAzureCDNCache(filePaths);
        case 'google-cdn':
          return await this.purgeMultipleGoogleCDNCache(filePaths);
        default:
          // For custom CDN or when no specific implementation is available
          logger.warn('CDN purge not implemented for provider', { 
            provider: this.config.provider, 
            fileCount: filePaths.length
          });
          return true;
      }
    } catch (error: any) {
      logger.error('CDN cache purge error for multiple files', { 
        error: error.message, 
        fileCount: filePaths.length,
        provider: this.config.provider
      });
      return false;
    }
  }

  // Prefetch/populate cache for a file
  async prefetchFile(filePath: string): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        logger.debug('CDN prefetch skipped - CDN not enabled', { filePath });
        return true;
      }

      logger.info('Prefetching file to CDN', { filePath });

      // In a real implementation, this would make an HTTP request to the CDN URL
      // to trigger caching of the file
      const cdnUrl = this.generateCDNUrl(filePath);
      
      // Make a HEAD request to prefetch the file
      const response = await fetch(cdnUrl, { method: 'HEAD' });
      
      if (response.ok) {
        logger.info('File prefetched to CDN successfully', { filePath, cdnUrl });
        return true;
      } else {
        logger.warn('Failed to prefetch file to CDN', { 
          filePath, 
          cdnUrl, 
          status: response.status 
        });
        return false;
      }
    } catch (error: any) {
      logger.error('CDN prefetch error', { 
        error: error.message, 
        filePath
      });
      return false;
    }
  }

  // Get CDN performance metrics (if supported by provider)
  async getPerformanceMetrics(): Promise<any> {
    try {
      if (!this.isEnabled) {
        return { enabled: false };
      }

      logger.debug('Getting CDN performance metrics');

      // Implementation would depend on the CDN provider
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.getCloudflareMetrics();
        default:
          // For providers without metrics API or when not implemented
          return { 
            enabled: true, 
            provider: this.config.provider,
            message: 'Metrics not available for this provider'
          };
      }
    } catch (error: any) {
      logger.error('CDN performance metrics error', { 
        error: error.message,
        provider: this.config.provider
      });
      return { 
        enabled: true, 
        provider: this.config.provider,
        error: error.message
      };
    }
  }

  // Cloudflare-specific cache purge
  private async purgeCloudflareCache(filePath: string): Promise<boolean> {
    if (!this.config.apiKey || !this.config.zoneId) {
      logger.warn('Cloudflare purge failed - missing API key or zone ID');
      return false;
    }

    try {
      const cdnUrl = this.generateCDNUrl(filePath);
      const purgeUrl = `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`;
      
      const response = await fetch(purgeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: [cdnUrl]
        })
      });

      const resultText = await response.text();
      const result = JSON.parse(resultText) as CloudflarePurgeResponse;
      
      if (result.success) {
        logger.info('Cloudflare cache purged successfully', { filePath, cdnUrl });
        return true;
      } else {
        logger.error('Cloudflare cache purge failed', { 
          filePath, 
          errors: result.errors 
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Cloudflare cache purge error', { 
        error: error.message, 
        filePath
      });
      return false;
    }
  }

  // Cloudflare-specific multiple files cache purge
  private async purgeMultipleCloudflareCache(filePaths: string[]): Promise<boolean> {
    if (!this.config.apiKey || !this.config.zoneId) {
      logger.warn('Cloudflare purge failed - missing API key or zone ID');
      return false;
    }

    try {
      const cdnUrls = filePaths.map(path => this.generateCDNUrl(path));
      const purgeUrl = `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`;
      
      const response = await fetch(purgeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: cdnUrls
        })
      });

      const resultText = await response.text();
      const result = JSON.parse(resultText) as CloudflarePurgeResponse;
      
      if (result.success) {
        logger.info('Cloudflare cache purged successfully for multiple files', { 
          fileCount: filePaths.length 
        });
        return true;
      } else {
        logger.error('Cloudflare cache purge failed for multiple files', { 
          fileCount: filePaths.length,
          errors: result.errors 
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Cloudflare cache purge error for multiple files', { 
        error: error.message, 
        fileCount: filePaths.length
      });
      return false;
    }
  }

  // Placeholder implementations for other CDN providers
  private async purgeCloudFrontCache(filePath: string): Promise<boolean> {
    logger.debug('CloudFront purge not implemented', { filePath });
    return true;
  }

  private async purgeMultipleCloudFrontCache(filePaths: string[]): Promise<boolean> {
    logger.debug('CloudFront multiple files purge not implemented', { fileCount: filePaths.length });
    return true;
  }

  private async purgeAzureCDNCache(filePath: string): Promise<boolean> {
    logger.debug('Azure CDN purge not implemented', { filePath });
    return true;
  }

  private async purgeMultipleAzureCDNCache(filePaths: string[]): Promise<boolean> {
    logger.debug('Azure CDN multiple files purge not implemented', { fileCount: filePaths.length });
    return true;
  }

  private async purgeGoogleCDNCache(filePath: string): Promise<boolean> {
    logger.debug('Google CDN purge not implemented', { filePath });
    return true;
  }

  private async purgeMultipleGoogleCDNCache(filePaths: string[]): Promise<boolean> {
    logger.debug('Google CDN multiple files purge not implemented', { fileCount: filePaths.length });
    return true;
  }

  // Placeholder for Cloudflare metrics
  private async getCloudflareMetrics(): Promise<any> {
    // This would require Cloudflare's analytics API
    return { 
      provider: 'cloudflare',
      message: 'Metrics API not implemented'
    };
  }
}

// Export singleton instance
export const cdnService = new CDNService();

// Export the class for testing purposes
export default CDNService;