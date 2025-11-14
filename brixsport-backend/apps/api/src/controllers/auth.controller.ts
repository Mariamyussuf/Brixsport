import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { authService } from '../services/auth.service';
import { errorHandlerService } from '../services/error.handler.service';
import { accountSecurityService } from '../services/security/account-security.service';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if account creation is allowed for this IP
    const ip = req.ip || 'unknown';
    const isAccountLocked = await accountSecurityService.isAccountLocked(ip);
    if (isAccountLocked) {
      logger.warn('Account creation blocked due to rate limiting', { ip });
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Too many account creation attempts, please try again later'
      });
      return;
    }
    
    // Validate request body
    if (!req.body || !req.body.name || !req.body.email || !req.body.password) {
      logger.warn('Signup failed: Missing required fields', { 
        ip, 
        hasName: !!req.body?.name,
        hasEmail: !!req.body?.email,
        hasPassword: !!req.body?.password
      });
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Name, email, and password are required'
      });
      return;
    }
    
    logger.info('Processing signup request', { email: req.body.email, ip });
    
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Signup error', { 
      error: error.message, 
      stack: error.stack,
      email: req.body?.email,
      ip: req.ip
    });
    
    // Provide more specific error messages for common issues
    if (error.message.includes('environment variables')) {
      const errorResponse = {
        success: false,
        error: 'Configuration error',
        message: error.message,
        code: 'CONFIG_ERROR'
      };
      res.status(500).json(errorResponse);
      return;
    }
    
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if account is locked due to too many failed attempts
    const isAccountLocked = await accountSecurityService.isAccountLocked(req.body.email);
    if (isAccountLocked) {
      res.status(429).json({
        success: false,
        error: 'Account locked',
        message: 'Account temporarily locked due to too many failed login attempts'
      });
      return;
    }
    
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    // Record failed login attempt
    if (error.message === 'Invalid email or password') {
      await accountSecurityService.recordFailedLogin(req.body.email);
    }
    
    logger.error('Login error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 401).json(errorResponse);
  }
};

export const refreshTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Token refresh error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 401).json(errorResponse);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.logout(userId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Logout error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const logoutAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.logoutAllSessions(userId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Logout all sessions error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.verifyEmail(req.body.token);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Email verification error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.resendVerification(req.body.email);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Resend verification error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Check if password reset is allowed for this email
    const isAccountLocked = await accountSecurityService.isAccountLocked(req.body.email);
    if (isAccountLocked) {
      res.status(429).json({
        success: true, // Don't reveal account status
        message: 'Password reset instructions sent'
      });
      return;
    }
    
    const result = await authService.forgotPassword(req.body.email, ipAddress, userAgent);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Forgot password error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const result = await authService.resetPassword(req.body.token, req.body.newPassword, ipAddress, userAgent);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Reset password error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.changePassword(
      userId,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Change password error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const enableMFA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.enableMFA(userId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Enable MFA error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const disableMFA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.disableMFA(userId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Disable MFA error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.listSessions(userId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('List sessions error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const revokeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const result = await authService.revokeSession(userId, req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Revoke session error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};