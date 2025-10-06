import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

// Configure authenticator
authenticator.options = {
  step: 30, // 30 seconds
  window: 1 // 1 window for validation
};

export const mfaService = {
  generateSecret: (): string => {
    return authenticator.generateSecret();
  },
  
  generateQRCode: async (secret: string, email: string, issuer: string = 'Brixsport'): Promise<string> => {
    try {
      const otpauth = authenticator.keyuri(email, issuer, secret);
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
      return qrCodeDataUrl;
    } catch (error: any) {
      logger.error('Failed to generate QR code', { error: error.message, email });
      throw error;
    }
  },
  
  verifyToken: async (userId: string, token: string): Promise<boolean> => {
    try {
      // Get user's MFA secret from database
      const user = await supabaseService.getUserById(userId);
      if (!user || !user.mfaSecret) {
        return false;
      }
      
      // Verify token
      const isValid = authenticator.check(token, user.mfaSecret);
      return isValid;
    } catch (error: any) {
      logger.error('MFA token verification failed', { error: error.message, userId });
      return false;
    }
  },
  
  generateRecoveryCodes: (count: number = 10): string[] => {
    return Array.from({ length: count }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  },
  
  enableMFA: async (userId: string): Promise<any> => {
    try {
      logger.info('Enabling MFA for user', { userId });
      
      // Generate secret
      const secret = mfaService.generateSecret();
      
      // Generate recovery codes
      const recoveryCodes = mfaService.generateRecoveryCodes();
      
      // Update user in database
      const result = await supabaseService.updateUser(userId, {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaRecoveryCodes: recoveryCodes
      });
      
      if (!result) {
        throw new Error('Failed to enable MFA');
      }
      
      return {
        success: true,
        data: {
          secret,
          recoveryCodes
        },
        message: 'MFA enabled successfully'
      };
    } catch (error: any) {
      logger.error('Failed to enable MFA', { error: error.message, userId });
      throw error;
    }
  },
  
  disableMFA: async (userId: string): Promise<any> => {
    try {
      logger.info('Disabling MFA for user', { userId });
      
      // Update user in database
      const result = await supabaseService.updateUser(userId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: null
      });
      
      if (!result) {
        throw new Error('Failed to disable MFA');
      }
      
      return {
        success: true,
        message: 'MFA disabled successfully'
      };
    } catch (error: any) {
      logger.error('Failed to disable MFA', { error: error.message, userId });
      throw error;
    }
  },
  
  isMFAEnabled: async (userId: string): Promise<boolean> => {
    try {
      const user = await supabaseService.getUserById(userId);
      return user ? user.mfaEnabled === true : false;
    } catch (error: any) {
      logger.error('Failed to check MFA status', { error: error.message, userId });
      return false;
    }
  },
  
  verifyRecoveryCode: async (userId: string, recoveryCode: string): Promise<boolean> => {
    try {
      const user = await supabaseService.getUserById(userId);
      if (!user || !user.mfaRecoveryCodes) {
        return false;
      }
      
      // Check if recovery code exists
      const recoveryCodes: string[] = user.mfaRecoveryCodes;
      const index = recoveryCodes.indexOf(recoveryCode.toUpperCase());
      
      if (index === -1) {
        return false;
      }
      
      // Remove used recovery code
      recoveryCodes.splice(index, 1);
      await supabaseService.updateUser(userId, {
        mfaRecoveryCodes: recoveryCodes
      });
      
      return true;
    } catch (error: any) {
      logger.error('Failed to verify recovery code', { error: error.message, userId });
      return false;
    }
  }
};