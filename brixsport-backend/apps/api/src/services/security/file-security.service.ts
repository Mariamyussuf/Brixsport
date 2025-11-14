import { logger } from '../../utils/logger';
import * as crypto from 'crypto';
import { UploadedFile } from './validation.service';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface FileSecurityService {
  validateFileType(file: UploadedFile, allowedTypes: string[]): Promise<boolean>;
  validateFileSize(file: UploadedFile, maxSize: number): Promise<boolean>;
  scanFileForMalware(file: UploadedFile): Promise<boolean>;
  sanitizeFileName(fileName: string): Promise<string>;
  generateSecureFileURL(fileId: string): Promise<string>;
  // New methods for production-ready implementation
  getFileSecurityConfig(): Promise<any>;
  updateFileSecurityConfig(config: any): Promise<void>;
  logFileUpload(fileInfo: any): Promise<void>;
  getFileUploadStats(): Promise<any>;
}

export const fileSecurityService: FileSecurityService = {
  validateFileType: async (file: UploadedFile, allowedTypes: string[]): Promise<boolean> => {
    try {
      logger.debug('Validating file type', { 
        fileName: file.originalName, 
        mimeType: file.mimeType 
      });
      
      // Check if MIME type is allowed
      const isAllowed = allowedTypes.includes(file.mimeType);
      
      if (!isAllowed) {
        logger.warn('File type not allowed', { 
          fileName: file.originalName, 
          mimeType: file.mimeType, 
          allowedTypes 
        });
      } else {
        logger.debug('File type validated', { fileName: file.originalName });
      }
      
      return isAllowed;
    } catch (error: any) {
      logger.error('File type validation error', error);
      return false;
    }
  },
  
  validateFileSize: async (file: UploadedFile, maxSize: number): Promise<boolean> => {
    try {
      logger.debug('Validating file size', { 
        fileName: file.originalName, 
        size: file.size, 
        maxSize 
      });
      
      // Check if file size is within limit
      const isValid = file.size <= maxSize;
      
      if (!isValid) {
        logger.warn('File too large', { 
          fileName: file.originalName, 
          size: file.size, 
          maxSize 
        });
      } else {
        logger.debug('File size validated', { fileName: file.originalName });
      }
      
      return isValid;
    } catch (error: any) {
      logger.error('File size validation error', error);
      return false;
    }
  },
  
  scanFileForMalware: async (file: UploadedFile): Promise<boolean> => {
    try {
      logger.debug('Scanning file for malware', { fileName: file.originalName });
      
      // In a real implementation, this would interface with a malware scanning service
      // For now, we'll simulate a basic check by looking for suspicious patterns
      const suspiciousPatterns = [
        /eval\s*\(/i,
        /exec\s*\(/i,
        /system\s*\(/i,
        /shell\s*\(/i,
        /php/i,
        /asp/i,
        /jsp/i
      ];
      
      // Convert buffer to string for pattern matching
      const fileContent = file.buffer.toString('utf8');
      
      // Check for suspicious patterns
      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(fileContent));
      
      if (isSuspicious) {
        logger.warn('Suspicious content detected in file', { fileName: file.originalName });
        return false;
      }
      
      // In a real implementation, you would use a dedicated malware scanning service
      logger.debug('File malware scan completed', { fileName: file.originalName });
      
      return true;
    } catch (error: any) {
      logger.error('File malware scan error', error);
      return false;
    }
  },
  
  sanitizeFileName: async (fileName: string): Promise<string> => {
    try {
      logger.debug('Sanitizing file name', { originalName: fileName });
      
      // Remove dangerous characters
      let sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Prevent directory traversal
      sanitized = sanitized.replace(/\.\./g, '');
      
      // Limit length
      if (sanitized.length > 255) {
        const ext = sanitized.split('.').pop() || '';
        sanitized = sanitized.substring(0, 255 - ext.length - 1) + '.' + ext;
      }
      
      logger.debug('File name sanitized', { sanitizedName: sanitized });
      
      return sanitized;
    } catch (error: any) {
      logger.error('File name sanitization error', error);
      throw error;
    }
  },
  
  generateSecureFileURL: async (fileId: string): Promise<string> => {
    try {
      logger.debug('Generating secure file URL', { fileId });
      
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Create secure URL with expiration
      const expiresAt = Date.now() + 3600000; // 1 hour from now
      const url = `/api/files/${fileId}?token=${token}&expires=${expiresAt}`;
      
      // Store token in Redis with expiration
      const tokenKey = `file:token:${token}`;
      await redisService.set(tokenKey, fileId, 3600); // Expire in 1 hour
      
      logger.debug('Secure file URL generated', { fileId, url });
      
      return url;
    } catch (error: any) {
      logger.error('Secure file URL generation error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  getFileSecurityConfig: async (): Promise<any> => {
    try {
      logger.debug('Getting file security configuration');
      
      // Try to get from Redis cache first
      const cachedConfig = await redisService.get('file:security:config');
      
      if (cachedConfig) {
        logger.debug('File security configuration retrieved from cache');
        return JSON.parse(cachedConfig);
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('FileSecurityConfig')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        logger.warn('File security configuration not found in database', { error: error.message });
        // Return default configuration
        const defaultConfig = {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
          malwareScanningEnabled: true,
          quarantineSuspiciousFiles: true
        };
        
        // Cache the default config for 1 hour
        await redisService.set('file:security:config', JSON.stringify(defaultConfig), 3600);
        
        return defaultConfig;
      }
      
      // Cache the config in Redis for 10 minutes
      await redisService.set('file:security:config', JSON.stringify(data), 600);
      
      logger.debug('File security configuration retrieved from database and cached');
      return data;
    } catch (error: any) {
      logger.error('Error getting file security configuration', { error: error.message });
      throw error;
    }
  },
  
  updateFileSecurityConfig: async (config: any): Promise<void> => {
    try {
      logger.debug('Updating file security configuration');
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('FileSecurityConfig')
        .upsert({
          id: 1, // Assuming single config record
          ...config,
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        logger.error('Error saving file security configuration to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache the config in Redis for 10 minutes
      await redisService.set('file:security:config', JSON.stringify(config), 600);
      
      logger.debug('File security configuration updated and cached');
    } catch (error: any) {
      logger.error('Error updating file security configuration', { error: error.message });
      throw error;
    }
  },
  
  logFileUpload: async (fileInfo: any): Promise<void> => {
    try {
      logger.debug('Logging file upload', { fileId: fileInfo.fileId });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('FileUploadLogs')
        .insert({
          ...fileInfo,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        logger.error('Error saving file upload log to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Update upload stats in Redis
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `file:uploads:daily:${today}`;
      const totalKey = 'file:uploads:total';
      
      await redisService.incr(dailyKey);
      await redisService.expire(dailyKey, 86400); // Expire in 24 hours
      await redisService.incr(totalKey);
      
      logger.debug('File upload logged', { fileId: fileInfo.fileId });
    } catch (error: any) {
      logger.error('Error logging file upload', { error: error.message });
      throw error;
    }
  },
  
  getFileUploadStats: async (): Promise<any> => {
    try {
      logger.debug('Getting file upload statistics');
      
      // Get stats from Redis
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `file:uploads:daily:${today}`;
      const totalKey = 'file:uploads:total';
      
      const dailyUploads = await redisService.get(dailyKey) || '0';
      const totalUploads = await redisService.get(totalKey) || '0';
      
      logger.debug('File upload statistics retrieved');
      return {
        daily: parseInt(dailyUploads, 10),
        total: parseInt(totalUploads, 10)
      };
    } catch (error: any) {
      logger.error('Error getting file upload statistics', { error: error.message });
      throw error;
    }
  }
};