import { Request as ExpressRequest, Response } from 'express';
import { logger } from '../utils/logger';
import { mfaService } from '../services/security/mfa.service';
import { sessionService } from '../services/security/session.service';
import { accountSecurityService } from '../services/security/account-security.service';
import { authorizationService } from '../services/security/authorization.service';
import { validationService } from '../services/security/validation.service';
import { encryptionService } from '../services/security/encryption.service';
import { auditService } from '../services/security/audit.service';
import { alertingService } from '../services/security/alerting.service';
import { securityMonitoring as monitoringService } from '../services/security/monitoring.service';
import { 
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError
} from '../types/errors';

interface Request extends ExpressRequest {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Security controller handling user security operations
 * Implements robust security measures and monitoring
 */

export const securityController = {
  /**
   * Enable Multi-Factor Authentication for a user
   * Implements strong security measures with rate limiting and monitoring
   */
  async enableMFA(req: Request, res: Response) {
    try {
      const { userId, method } = req.body;

      // Check if user exists and is active
      const userExists = await accountSecurityService.checkUserExists(userId);
      if (!userExists) {
        throw new NotFoundError('User not found');
      }

      // Validate user has proper permissions
      const hasPermission = await authorizationService.hasPermission(userId, 'security.mfa.enable');
      if (!hasPermission) {
        throw new AuthorizationError('User does not have permission to enable MFA');
      }

      // Check if MFA is already enabled
      const mfaStatus = await mfaService.getMFASettings(userId);
      if (mfaStatus.enabled && mfaStatus.method === method) {
        throw new ConflictError('MFA is already enabled with this method');
      }

      // Validate MFA method
      if (method && !['totp', 'sms', 'email'].includes(method)) {
        throw new ValidationError('Invalid MFA method', { 
          method: 'Must be one of: totp, sms, email' 
        });
      }

      // Enable MFA with enhanced security
      const mfaSetup = await mfaService.enableMFA(userId, (method || 'totp') as 'totp' | 'sms' | 'email');

      // Monitor for suspicious activity
      const riskScore = await accountSecurityService.calculateRiskScore({
        userId,
        action: 'enable_mfa',
        ip: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      // If risk score is high, alert security team
      if (riskScore > 0.7) {
        await alertingService.sendSecurityAlert({
          type: 'high_risk_mfa_change',
          message: 'High risk MFA change detected',
          severity: 'high',
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
          timestamp: new Date(),
          resolved: false,
          details: {
            userId,
            riskScore,
            action: 'enable_mfa',
            ip: req.ip || '127.0.0.1'
          }
        });
      }

      // Log security audit with enhanced details
      await auditService.logSecurityEvent({
        id: `mfa-${Date.now()}`,
        userId,
        eventType: 'mfa_enabled',
        resource: 'user_account',
        action: 'enable_mfa',
        timestamp: new Date(),
        severity: riskScore > 0.7 ? 'high' : 'medium',
        details: {
          method: method || 'totp',
          riskScore,
          deviceInfo: req.headers['user-agent'],
          geoLocation: req.headers['cf-ipcountry'] || 'unknown'
        },
        outcome: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        success: true,
        data: {
          ...mfaSetup,
          nextSteps: mfaSetup.method === 'totp' 
            ? ['scan_qr_code', 'verify_code'] 
            : ['verify_contact']
        },
        message: 'MFA enabled successfully'
      });
    } catch (error: any) {
      // Handle specific error types
      if (error instanceof BaseError) {
        throw error;
      }

      logger.error('Enable MFA error:', error);
      throw new InternalServerError('Failed to enable MFA');
    }
  },
  
  /**
   * Create a secure session with advanced security checks and monitoring
   */
  async createSession(req: Request, res: Response) {
    try {
      const { userId } = req.body;

      // Check if user exists and is in good standing
      const accountStatus = await accountSecurityService.getAccountStatus(userId);
      if (!accountStatus.exists) {
        throw new NotFoundError('User not found');
      }
      if (!accountStatus.isActive) {
        throw new AuthenticationError('Account is not active');
      }
      if (accountStatus.isLocked) {
        throw new AuthenticationError('Account is locked. Please contact support.');
      }

      // Check concurrent sessions limit
      const activeSessions = await sessionService.getActiveSessions(userId);
      const maxSessions = await accountSecurityService.getMaxConcurrentSessions(userId);
      if (activeSessions.length >= maxSessions) {
        throw new ConflictError('Maximum number of concurrent sessions reached');
      }

      // Check if additional authentication is required
      // Check if MFA is required
      const requiresMFA = await mfaService.isMFARequired(userId);

      if (requiresMFA) {
        throw new AuthenticationError('MFA verification required');
      }

      // Check for suspicious activity
      const riskAssessment = await accountSecurityService.assessLoginRisk({
        userId,
        ip: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
      });

      if (riskAssessment.isHighRisk) {
        await alertingService.sendSecurityAlert({
          id: `alert-${Date.now()}`,
          type: 'suspicious_login_attempt',
          severity: 'high',
          message: 'High-risk login attempt detected',
          timestamp: new Date(),
          details: {
            userId,
            riskFactors: riskAssessment.riskFactors,
            location: req.headers['cf-ipcountry'] || 'unknown'
          },
          resolved: false
        });
        
        if (riskAssessment.requiresVerification) {
          throw new AuthenticationError('Additional verification required due to suspicious activity');
        }
      }

      // Create session with enhanced security
      const session = await sessionService.createSession(
        userId,
        req.headers['user-agent'] || '',
        req.ip || ''
      );

      // Record successful login
      await accountSecurityService.resetFailedLogins(userId);
      await accountSecurityService.sendSecurityAlert(
        userId,
        'successful_login',
        req.ip || ''
      );

      // Log enhanced security audit
      await auditService.logSecurityEvent({
        id: `session-${Date.now()}`,
        userId,
        eventType: 'session_created',
        resource: 'user_session',
        action: 'create_session',
        timestamp: new Date(),
        severity: riskAssessment.isHighRisk ? 'high' : 'low',
        details: {
          sessionId: session.id,
          deviceId: req.body.deviceId,
          riskLevel: riskAssessment.riskLevel,
          riskFactors: riskAssessment.riskFactors,
          geoLocation: req.headers['cf-ipcountry'] || 'unknown',
          platform: req.headers['sec-ch-ua-platform'] || 'unknown'
        },
        outcome: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        success: true,
        data: {
          ...session,
          securityInfo: {
            requiresPasswordChange: accountStatus.requiresPasswordChange,
            requiresMFASetup: accountStatus.requiresMFASetup,
            securityRecommendations: accountStatus.securityRecommendations
          }
        },
        message: 'Session created successfully'
      });

    } catch (error: any) {
      if (error instanceof BaseError) {
        throw error;
      }

      logger.error('Session creation error:', error);
      throw new InternalServerError('Failed to create session');
    }
  },
  
  /**
   * Validate password strength with comprehensive security checks
   */
  async validatePassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      
      // Validate input format
      if (!password || typeof password !== 'string') {
        throw new ValidationError('Password is required and must be a string');
      }
      
      // Check for common passwords
      const isCommonPassword = await accountSecurityService.isCommonPassword(password);
      if (isCommonPassword) {
        throw new ValidationError('This password is too common and easily guessable');
      }
      
      // Validate password strength with detailed feedback
      const result = await accountSecurityService.validatePasswordStrength(password);
      
      // Log password validation attempt (without the actual password)
      await auditService.logSecurityEvent({
        id: `pwd-validate-${Date.now()}`,
        userId: req.user?.id || 'anonymous',
        eventType: 'password_validation',
        resource: 'user_password',
        action: 'validate_strength',
        timestamp: new Date(),
        severity: 'low',
        details: {
          score: result.score,
          hasWarnings: !!result.feedback.warning
        },
        outcome: result.score >= 3 ? 'success' : 'failure',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.json({
        success: true,
        data: {
          ...result,
          recommendations: [
            ...result.feedback.suggestions,
            result.score < 3 ? 'Consider using a password manager' : null,
            result.score < 4 ? 'Add more unique characters or increase length' : null
          ].filter(Boolean)
        },
        message: result.score >= 3 
          ? 'Password meets security requirements' 
          : 'Password needs improvement'
      });
    } catch (error: any) {
      if (error instanceof BaseError) {
        throw error;
      }

      logger.error('Password validation error:', error);
      throw new InternalServerError('Failed to validate password');
    }
  },
  
  /**
   * Check user permissions with caching and audit logging
   */
  async checkPermission(req: Request, res: Response) {
    try {
      const { userId, permission } = req.body;
      
      // Input validation with detailed feedback
      if (!userId || typeof userId !== 'string') {
        throw new ValidationError('User ID is required and must be a string');
      }
      if (!permission || typeof permission !== 'string') {
        throw new ValidationError('Permission identifier is required and must be a string');
      }
      
      // Check if user exists and is active
      const accountStatus = await accountSecurityService.checkAccountStatus(userId);
      if (!accountStatus.exists) {
        throw new NotFoundError('User not found');
      }
      if (!accountStatus.isActive) {
        throw new AuthorizationError('User account is not active');
      }

      // Check for suspicious permission checks
      const suspiciousCheck = await authorizationService.isSuspiciousPermissionCheck({
        userId,
        permission,
        ip: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      if (suspiciousCheck.isSuspicious) {
        await alertingService.sendSecurityAlert({
          id: `perm-check-${Date.now()}`,
          type: 'suspicious_permission_check',
          severity: 'medium',
          message: 'Suspicious permission check detected',
          timestamp: new Date(),
          details: {
            userId,
            permission,
            reasons: suspiciousCheck.reasons,
            location: req.headers['cf-ipcountry'] || 'unknown'
          },
          resolved: false
        });
      }
      
      // Check permission with caching
      const hasPermission = await authorizationService.hasPermission(userId, permission);
      
      // Log permission check
      await auditService.logSecurityEvent({
        id: `perm-check-${Date.now()}`,
        userId,
        eventType: 'permission_check',
        resource: 'user_permission',
        action: 'check_permission',
        timestamp: new Date(),
        severity: suspiciousCheck.isSuspicious ? 'medium' : 'low',
        details: {
          permission,
          granted: hasPermission,
          suspicious: suspiciousCheck.isSuspicious,
          reasons: suspiciousCheck.reasons
        },
        outcome: hasPermission ? 'success' : 'failure',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.json({
        success: true,
        data: {
          hasPermission,
          details: hasPermission ? {
            grantedAt: new Date(),
            expiresAt: new Date(Date.now() + 3600000), // 1 hour cache
            scope: permission
          } : undefined
        },
        message: hasPermission ? 
          'Permission granted' : 
          'Permission denied'
      });
    } catch (error: any) {
      if (error instanceof BaseError) {
        throw error;
      }

      logger.error('Permission check error:', error);
      throw new InternalServerError('Failed to check permission');
    }
  },
  
  /**
   * Encrypt sensitive data with robust security measures
   */
  async encryptData(req: Request, res: Response) {
    try {
      const { data, purpose } = req.body;
      
      // Validate input with strict requirements
      if (!data || typeof data !== 'string') {
        throw new ValidationError('Data must be a non-empty string');
      }
      
      if (!purpose || typeof purpose !== 'string') {
        throw new ValidationError('Encryption purpose must be specified');
      }

      // Validate encryption purpose
      const allowedPurposes = ['storage', 'transmission', 'backup'];
      if (!allowedPurposes.includes(purpose)) {
        throw new ValidationError('Invalid encryption purpose', {
          allowed: allowedPurposes
        });
      }

      // Check data size limits
      const maxSizeBytes = 1024 * 1024; // 1MB
      if (Buffer.from(data).length > maxSizeBytes) {
        throw new ValidationError('Data exceeds maximum size limit');
      }

      // Encrypt data with built-in rate limiting
      const encrypted = await encryptionService.encrypt(data);

      // Log encryption operation
      await auditService.logSecurityEvent({
        id: `encrypt-${Date.now()}`,
        userId: req.user?.id || 'anonymous',
        eventType: 'data_encryption',
        resource: 'sensitive_data',
        action: 'encrypt',
        timestamp: new Date(),
        severity: 'medium',
        details: {
          purpose,
          dataSize: Buffer.from(data).length,
          algorithm: encrypted.algorithm,
          keyId: encrypted.keyId
        },
        outcome: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.json({
        success: true,
        data: encrypted,
        message: 'Data encrypted successfully'
      });
    } catch (error: any) {
      if (error instanceof BaseError) {
        throw error;
      }

      logger.error('Data encryption error:', error);
      throw new InternalServerError('Failed to encrypt data');
    }
  }
};