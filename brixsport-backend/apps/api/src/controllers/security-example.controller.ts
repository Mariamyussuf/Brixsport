import { Request, Response } from 'express';
import { logger } from '@utils/logger';
import { mfaService } from '../services/security/mfa.service';
import { sessionService } from '../services/security/session.service';
import { accountSecurityService } from '../services/security/account-security.service';
import { authorizationService } from '../services/security/authorization.service';
import { validationService } from '../services/security/validation.service';
import { encryptionService } from '../services/security/encryption.service';
import { auditService } from '../services/security/audit.service';

/**
 * Example controller demonstrating how to use the security services
 * This is not meant to be used in production, but shows integration patterns
 */

export const securityExampleController = {
  // Example of enabling MFA for a user
  async enableMFA(req: Request, res: Response) {
    try {
      const { userId, method } = req.body;
      
      // Validate input
      const validation = await validationService.validateInput(
        { userId, method },
        {
          fields: {
            userId: { type: 'string', required: true },
            method: { type: 'string', required: false, enum: ['totp', 'sms', 'email'] }
          }
        }
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }
      
      // Enable MFA
      const mfaSetup = await mfaService.enableMFA(userId, method || 'totp');
      
      // Log security event
      await auditService.logSecurityEvent({
        id: `mfa-${Date.now()}`,
        userId,
        eventType: 'mfa_enabled',
        resource: 'user_account',
        action: 'enable_mfa',
        timestamp: new Date(),
        severity: 'medium',
        details: { method: method || 'totp' },
        outcome: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.json({
        success: true,
        data: mfaSetup,
        message: 'MFA enabled successfully'
      });
    } catch (error: any) {
      logger.error('Enable MFA error', error);
      
      // Log security event
      await auditService.logSecurityEvent({
        id: `mfa-error-${Date.now()}`,
        userId: req.body.userId,
        eventType: 'mfa_enabled',
        resource: 'user_account',
        action: 'enable_mfa',
        timestamp: new Date(),
        severity: 'high',
        details: { error: error.message },
        outcome: 'failure',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => logger.error('Failed to log security event', err));
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  // Example of creating a secure session
  async createSession(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      
      // Validate input
      const validation = await validationService.validateInput(
        { userId },
        {
          fields: {
            userId: { type: 'string', required: true }
          }
        }
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }
      
      // Create session
      const session = await sessionService.createSession(
        userId,
        req.headers['user-agent'] || '',
        req.ip || ''
      );
      
      // Log security event
      await auditService.logSecurityEvent({
        id: `session-${Date.now()}`,
        userId,
        eventType: 'session_created',
        resource: 'user_session',
        action: 'create_session',
        timestamp: new Date(),
        severity: 'low',
        details: { sessionId: session.id },
        outcome: 'success',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.json({
        success: true,
        data: session,
        message: 'Session created successfully'
      });
    } catch (error: any) {
      logger.error('Create session error', error);
      
      // Log security event
      await auditService.logSecurityEvent({
        id: `session-error-${Date.now()}`,
        userId: req.body.userId,
        eventType: 'session_created',
        resource: 'user_session',
        action: 'create_session',
        timestamp: new Date(),
        severity: 'medium',
        details: { error: error.message },
        outcome: 'failure',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => logger.error('Failed to log security event', err));
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  // Example of validating password strength
  async validatePassword(req: Request, res: Response) {
    try {
      const { password } = req.body;
      
      // Validate input
      const validation = await validationService.validateInput(
        { password },
        {
          fields: {
            password: { type: 'string', required: true }
          }
        }
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }
      
      // Validate password strength
      const result = await accountSecurityService.validatePasswordStrength(password);
      
      return res.json({
        success: true,
        data: result,
        message: 'Password validation completed'
      });
    } catch (error: any) {
      logger.error('Password validation error', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  // Example of checking user permissions
  async checkPermission(req: Request, res: Response) {
    try {
      const { userId, permission } = req.body;
      
      // Validate input
      const validation = await validationService.validateInput(
        { userId, permission },
        {
          fields: {
            userId: { type: 'string', required: true },
            permission: { type: 'string', required: true }
          }
        }
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }
      
      // Check permission
      const hasPermission = await authorizationService.hasPermission(userId, permission);
      
      return res.json({
        success: true,
        data: { hasPermission },
        message: 'Permission check completed'
      });
    } catch (error: any) {
      logger.error('Permission check error', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  // Example of encrypting sensitive data
  async encryptData(req: Request, res: Response) {
    try {
      const { data } = req.body;
      
      // Validate input
      const validation = await validationService.validateInput(
        { data },
        {
          fields: {
            data: { type: 'string', required: true }
          }
        }
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }
      
      // Encrypt data
      const encrypted = await encryptionService.encrypt(data);
      
      return res.json({
        success: true,
        data: encrypted,
        message: 'Data encrypted successfully'
      });
    } catch (error: any) {
      logger.error('Data encryption error', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};