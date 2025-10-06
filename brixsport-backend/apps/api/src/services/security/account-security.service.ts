import { logger } from '@utils/logger';
import * as bcrypt from 'bcryptjs';
import { supabaseService } from '../supabase.service';
import { redisService } from '../redis.service';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 scale
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

export interface AccountSecurityService {
  recordFailedLogin(email: string): Promise<void>;
  resetFailedLogins(email: string): Promise<void>;
  isAccountLocked(email: string): Promise<boolean>;
  sendSecurityAlert(userId: string, event: string, ip: string): Promise<void>;
  validatePasswordStrength(password: string): Promise<PasswordValidationResult>;
}

export const accountSecurityService: AccountSecurityService = {
  recordFailedLogin: async (email: string): Promise<void> => {
    try {
      logger.info('Recording failed login', { email });
      
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
      const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '300'); // 5 minutes default
      
      // Get current failed attempts from Redis
      const key = `failed_logins:${email}`;
      let attempts = parseInt(await redisService.get(key) || '0');
      
      attempts += 1;
      
      // Store updated attempts with expiration
      await redisService.set(key, attempts.toString(), lockoutDuration);
      
      logger.info('Failed login recorded', { 
        email, 
        attempts,
        maxAttempts
      });
    } catch (error: any) {
      logger.error('Failed login recording error', error);
      throw error;
    }
  },
  
  resetFailedLogins: async (email: string): Promise<void> => {
    try {
      logger.info('Resetting failed logins', { email });
      
      const key = `failed_logins:${email}`;
      await redisService.del(key);
      
      logger.info('Failed logins reset', { email });
    } catch (error: any) {
      logger.error('Failed logins reset error', error);
      throw error;
    }
  },
  
  isAccountLocked: async (email: string): Promise<boolean> => {
    try {
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
      
      const key = `failed_logins:${email}`;
      const attemptsStr = await redisService.get(key);
      const attempts = attemptsStr ? parseInt(attemptsStr) : 0;
      
      const isLocked = attempts >= maxAttempts;
      
      if (isLocked) {
        logger.warn('Account is locked', { email });
      }
      
      return isLocked;
    } catch (error: any) {
      logger.error('Account lock check error', error);
      return false;
    }
  },
  
  sendSecurityAlert: async (userId: string, event: string, ip: string): Promise<void> => {
    try {
      logger.info('Sending security alert', { userId, event, ip });
      
      // Create security alert record in database
      const { error } = await (supabaseService as any).supabase
        .from('SecurityAlert')
        .insert({
          id: uuidv4(),
          userId: userId,
          eventType: event,
          ip: ip,
          timestamp: new Date().toISOString(),
          severity: 'medium',
          details: '{}'
        });
      
      if (error) {
        logger.warn('Failed to store security alert in database', { error: error.message });
      }
      
      // In a real implementation, you would send an email or notification to the user
      // For now, we'll just log it
      logger.warn('Security alert sent', { userId, event, ip });
    } catch (error: any) {
      logger.error('Security alert error', error);
      throw error;
    }
  },
  
  validatePasswordStrength: async (password: string): Promise<PasswordValidationResult> => {
    try {
      logger.debug('Validating password strength');
      
      let score = 0;
      const feedback = {
        warning: '',
        suggestions: [] as string[]
      };
      
      // Length check
      if (password.length >= 12) {
        score += 1;
      } else {
        feedback.suggestions.push('Use at least 12 characters');
      }
      
      // Complexity checks
      if (/[a-z]/.test(password)) score += 1;
      else feedback.suggestions.push('Include lowercase letters');
      
      if (/[A-Z]/.test(password)) score += 1;
      else feedback.suggestions.push('Include uppercase letters');
      
      if (/[0-9]/.test(password)) score += 1;
      else feedback.suggestions.push('Include numbers');
      
      if (/[^A-Za-z0-9]/.test(password)) score += 1;
      else feedback.suggestions.push('Include special characters');
      
      // Common password check (simplified)
      const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
      if (commonPasswords.includes(password.toLowerCase())) {
        score = Math.min(score, 2);
        feedback.warning = 'Password is too common';
      }
      
      // Sequential characters check
      if (/0123|1234|2345|3456|4567|5678|6789|7890|abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i.test(password)) {
        score = Math.min(score, 3);
        if (!feedback.warning) {
          feedback.warning = 'Password contains sequential characters';
        }
      }
      
      const isValid = score >= 4;
      
      if (!isValid && feedback.suggestions.length === 0) {
        feedback.suggestions.push('Make your password stronger');
      }
      
      logger.debug('Password strength validated', { score, isValid });
      
      return {
        isValid,
        score,
        feedback
      };
    } catch (error: any) {
      logger.error('Password strength validation error', error);
      throw error;
    }
  }
};

// Helper function for UUID generation
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}