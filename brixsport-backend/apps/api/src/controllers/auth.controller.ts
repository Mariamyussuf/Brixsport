import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { authService } from '../services/auth.service';
import { errorHandlerService } from '../services/error.handler.service';

export const signup = async (req: Request, res: Response) => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Signup error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 401).json(errorResponse);
  }
};

export const refreshTokens = async (req: Request, res: Response) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Token refresh error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 401).json(errorResponse);
  }
};

export const logout = async (req: Request, res: Response) => {
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

export const logoutAllSessions = async (req: Request, res: Response) => {
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

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyEmail(req.body.token);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Email verification error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const result = await authService.resendVerification(req.body.email);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Resend verification error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Forgot password error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Reset password error', { error: error.message, stack: error.stack });
    const errorResponse = errorHandlerService.createErrorResponse(error);
    res.status(errorResponse.statusCode || 500).json(errorResponse);
  }
};

export const changePassword = async (req: Request, res: Response) => {
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

export const enableMFA = async (req: Request, res: Response) => {
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

export const disableMFA = async (req: Request, res: Response) => {
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

export const listSessions = async (req: Request, res: Response) => {
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

export const revokeSession = async (req: Request, res: Response) => {
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