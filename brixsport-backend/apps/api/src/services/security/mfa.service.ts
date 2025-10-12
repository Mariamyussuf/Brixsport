import { logger } from '@utils/logger';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { supabaseService } from '../supabase.service';
import { redisService } from '../redis.service';
import { MFASetup } from '../../types/security.types'; // Import the MFASetup interface from types

export interface MFAService {
  enableMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<MFASetup>;
  verifyMFA(userId: string, code: string): Promise<boolean>;
  disableMFA(userId: string): Promise<void>;
  generateBackupCodes(userId: string): Promise<string[]>;
  validateBackupCode(userId: string, code: string): Promise<boolean>;
  getMFASettings(userId: string): Promise<{ enabled: boolean; method?: 'totp' | 'sms' | 'email' }>;
  isMFARequired(userId: string): Promise<boolean>;
  setMFARequired(userId: string, required: boolean): Promise<void>;
}

// Extended interface that includes backup codes for internal use
export interface MFASetupWithBackupCodes extends MFASetup {
  backupCodes?: string[];
}

export const mfaService: MFAService = {
  async getMFASettings(userId: string) {
    const settings = await supabaseService.getUserById(userId);
    return {
      enabled: Boolean(settings?.mfaEnabled),
      method: settings?.mfaMethod as 'totp' | 'sms' | 'email'
    };
  },

  async isMFARequired(userId: string) {
    const user = await supabaseService.getUserById(userId);
    return Boolean(user?.mfaRequired);
  },

  async setMFARequired(userId: string, required: boolean) {
    await supabaseService.updateUser(userId, { mfaRequired: required });
  },

  // Existing methods
  enableMFA: async (userId: string, method: 'totp' | 'sms' | 'email' = 'totp'): Promise<MFASetup> => {
    try {
      logger.info('Enabling MFA', { userId, method });
      
      if (method !== 'totp') {
        throw new Error('Only TOTP method is currently supported');
      }
      
      // Generate a secret for TOTP
      const secret = authenticator.generateSecret();
      
      // Get user email for QR code generation
      const user = await supabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate QR code URL
      const serviceName = 'Brixsport';
      const qrCodeUrl = authenticator.keyuri(user.email, serviceName, secret);
      
      // Generate QR code image
      const qrCode = await QRCode.toDataURL(qrCodeUrl);
      
      // Generate backup codes
      const codes = await mfaService.generateBackupCodes(userId);
      
      // Store MFA configuration in database
      const { error } = await (supabaseService as any).supabase
        .from('UserMFA')
        .upsert({
          userId: userId,
          method: method,
          secret: secret,
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'userId'
        });
      
      if (error) {
        throw new Error(`Failed to store MFA configuration: ${error.message}`);
      }
      
      logger.info('MFA enabled', { userId, method });
      
      // Return MFASetup object that matches the interface from types
      return {
        id: userId, // Use userId as the id
        method,
        secret,
        qrCode,
        isVerified: false // Set to false initially, will be verified when user enters code
      };
    } catch (error: any) {
      logger.error('MFA enable error', error);
      throw error;
    }
  },
  
  verifyMFA: async (userId: string, code: string): Promise<boolean> => {
    try {
      logger.info('Verifying MFA code', { userId });
      
      // Retrieve user's MFA configuration from database
      const { data, error } = await (supabaseService as any).supabase
        .from('UserMFA')
        .select('secret')
        .eq('userId', userId)
        .eq('enabled', true)
        .single();
      
      if (error || !data) {
        logger.warn('MFA configuration not found or not enabled', { userId });
        return false;
      }
      
      // Verify the TOTP code
      const isValid = authenticator.check(code, data.secret);
      
      if (isValid) {
        logger.info('MFA code verified', { userId });
      } else {
        logger.warn('Invalid MFA code', { userId });
      }
      
      return isValid;
    } catch (error: any) {
      logger.error('MFA verification error', error);
      return false;
    }
  },
  
  disableMFA: async (userId: string): Promise<void> => {
    try {
      logger.info('Disabling MFA', { userId });
      
      // Remove backup codes from Redis
      await redisService.del(`mfa:backup_codes:${userId}`);
      
      // Disable MFA in database
      const { error } = await (supabaseService as any).supabase
        .from('UserMFA')
        .update({ 
          enabled: false,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId);
      
      if (error) {
        throw new Error(`Failed to disable MFA: ${error.message}`);
      }
      
      logger.info('MFA disabled', { userId });
    } catch (error: any) {
      logger.error('MFA disable error', error);
      throw error;
    }
  },
  
  generateBackupCodes: async (userId: string): Promise<string[]> => {
    try {
      logger.info('Generating backup codes', { userId });
      
      // Generate 10 backup codes
      const codes: string[] = [];
      for (let i = 0; i < 10; i++) {
        // Generate a random 8-character alphanumeric code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
      }
      
      // Hash codes for secure storage
      const hashedCodes = await Promise.all(
        codes.map(async (code) => {
          const saltRounds = 10;
          return await bcrypt.hash(code, saltRounds);
        })
      );
      
      // Store hashed codes in Redis with 30-day expiration
      await redisService.del(`mfa:backup_codes:${userId}`);
      for (const hashedCode of hashedCodes) {
        await redisService.sadd(`mfa:backup_codes:${userId}`, hashedCode);
      }
      await redisService.expire(`mfa:backup_codes:${userId}`, 30 * 24 * 60 * 60); // 30 days
      
      logger.info('Backup codes generated', { userId, count: codes.length });
      
      return codes;
    } catch (error: any) {
      logger.error('Backup code generation error', error);
      throw error;
    }
  },
  
  validateBackupCode: async (userId: string, code: string): Promise<boolean> => {
    try {
      logger.info('Validating backup code', { userId });
      
      // Get all backup codes for user from Redis
      const hashedCodes = await redisService.smembers(`mfa:backup_codes:${userId}`);
      
      if (!hashedCodes || hashedCodes.length === 0) {
        return false;
      }
      
      // Check if code matches any of the backup codes
      for (const hashedCode of hashedCodes) {
        const isValid = await bcrypt.compare(code, hashedCode);
        if (isValid) {
          // Remove the used code
          await redisService.srem(`mfa:backup_codes:${userId}`, hashedCode);
          logger.info('Backup code validated', { userId });
          return true;
        }
      }
      
      logger.warn('Invalid backup code', { userId });
      return false;
    } catch (error: any) {
      logger.error('Backup code validation error', error);
      return false;
    }
  }
};