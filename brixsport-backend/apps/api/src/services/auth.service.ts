import { logger } from '../utils/logger';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseService } from './supabase.service';
import { sessionService } from './security/session.service';
import { emailService } from './email.service';
import { mfaService } from './mfa.service';
import { centralizedDatabaseService } from './centralized-database.service';
import { v4 as uuidv4 } from 'uuid';

export const authService = {
  signup: async (userData: any) => {
    try {
      logger.info('User signup attempt', userData);
      
      // Check if user already exists
      const existingUser = await supabaseService.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Hash password using the centralized database service
      const hashedPassword = await centralizedDatabaseService.hashPassword(userData.password);
      
      // Create user
      const user = await supabaseService.createUser({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'user'
      });
      
      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Store refresh token in Redis with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await sessionService.createRefreshSession(refreshToken, {
        userId: user.id,
        createdAt: new Date(),
        expiresAt
      }, 7 * 24 * 60 * 60);
      
      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.EMAIL_VERIFICATION_SECRET || 'fallback_email_secret',
        { expiresIn: '24h' }
      );
      
      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationToken);
      
      // Remove sensitive information
      const { password, ...publicUser } = user;
      
      return {
        success: true,
        data: {
          user: publicUser,
          token,
          refreshToken
        },
        message: 'User registered successfully. Please check your email for verification.'
      };
    } catch (error: any) {
      logger.error('Signup error', error);
      throw error;
    }
  },
  
  login: async (credentials: any) => {
    try {
      logger.info('User login attempt', credentials);
      
      // Find user by email
      const user = await supabaseService.getUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Check if user is suspended
      if (user.suspended) {
        throw new Error('User account is suspended');
      }
      
      // Verify password using bcrypt directly since we need to compare with stored hash
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Check if MFA is enabled for user
      const isMFAEnabled = await mfaService.isMFAEnabled(user.id);
      
      if (isMFAEnabled) {
        // Generate temporary token for MFA verification
        const mfaToken = jwt.sign(
          { userId: user.id, temp: true },
          process.env.MFA_TEMP_SECRET || 'fallback_mfa_temp',
          { expiresIn: '5m' }
        );
        
        // Remove sensitive information
        const { password, ...publicUser } = user;
        
        return {
          success: true,
          data: {
            user: publicUser,
            mfaRequired: true,
            mfaToken
          },
          message: 'MFA required'
        };
      }
      
      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Store refresh token in Redis with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await sessionService.createRefreshSession(refreshToken, {
        userId: user.id,
        createdAt: new Date(),
        expiresAt
      }, 7 * 24 * 60 * 60);
      
      // Remove sensitive information
      const { password, ...publicUser } = user;
      
      return {
        success: true,
        data: {
          user: publicUser,
          token,
          refreshToken
        },
        message: 'Logged in successfully'
      };
    } catch (error: any) {
      logger.error('Login error', error);
      throw error;
    }
  },
  
  refreshTokens: async (refreshToken: string) => {
    try {
      logger.info('Token refresh attempt', refreshToken);
      
      // Check if refresh token exists and is valid
      const storedSession = await sessionService.getRefreshSession(refreshToken);
      if (!storedSession) {
        throw new Error('Invalid refresh token');
      }
      
      // Check if token is expired
      if (sessionService.isSessionExpired(storedSession)) {
        // Remove expired token
        await sessionService.deleteRefreshSession(refreshToken, storedSession.userId);
        throw new Error('Refresh token has expired');
      }
      
      // Verify refresh token
      const decoded: any = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret'
      );
      
      // Get user to ensure they still exist and are not suspended
      const user = await supabaseService.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.suspended) {
        throw new Error('User account is suspended');
      }
      
      // Generate new tokens
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
      
      const newRefreshToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Remove old refresh token and add new one
      await sessionService.deleteRefreshSession(refreshToken, decoded.userId);
      
      // Store new refresh token with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await sessionService.createRefreshSession(newRefreshToken, {
        userId: decoded.userId,
        createdAt: new Date(),
        expiresAt
      }, 7 * 24 * 60 * 60);
      
      return {
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        },
        message: 'Tokens refreshed successfully'
      };
    } catch (error: any) {
      logger.error('Token refresh error', error);
      throw error;
    }
  },
  
  logout: async (userId: string) => {
    try {
      logger.info('User logout', userId);
      
      // Remove all refresh tokens for this user
      await sessionService.deleteAllUserSessions(userId);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error: any) {
      logger.error('Logout error', error);
      throw error;
    }
  },
  
  logoutAllSessions: async (userId: string) => {
    try {
      logger.info('User logout all sessions', userId);
      
      // Remove all refresh tokens for this user
      await sessionService.deleteAllUserSessions(userId);
      
      return {
        success: true,
        message: 'All sessions terminated'
      };
    } catch (error: any) {
      logger.error('Logout all sessions error', error);
      throw error;
    }
  },
  
  verifyEmail: async (token: string) => {
    try {
      logger.info('Email verification attempt', token);
      
      // Verify the email token
      const decoded: any = jwt.verify(
        token,
        process.env.EMAIL_VERIFICATION_SECRET || 'fallback_email_secret'
      );
      
      // Update user as verified in database
      const result = await supabaseService.updateUser(decoded.userId, { 
        emailVerified: true,
        emailVerifiedAt: new Date()
      });
      
      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error: any) {
      logger.error('Email verification error', error);
      throw error;
    }
  },
  
  resendVerification: async (email: string) => {
    try {
      logger.info('Resend verification email', email);
      
      // Check if user exists
      const user = await supabaseService.getUserByEmail(email);
      if (!user) {
        // For security, we don't reveal if the email exists
        return {
          success: true,
          message: 'Verification email sent'
        };
      }
      
      // Check if user is already verified
      if (user.emailVerified) {
        return {
          success: true,
          message: 'Email is already verified'
        };
      }
      
      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.EMAIL_VERIFICATION_SECRET || 'fallback_email_secret',
        { expiresIn: '24h' }
      );
      
      // Send verification email
      await emailService.sendVerificationEmail(email, verificationToken);
      
      return {
        success: true,
        message: 'Verification email sent'
      };
    } catch (error: any) {
      logger.error('Resend verification error', error);
      throw error;
    }
  },
  
  forgotPassword: async (email: string) => {
    try {
      logger.info('Password reset request', email);
      
      // Check if user exists
      const user = await supabaseService.getUserByEmail(email);
      if (!user) {
        // For security, we don't reveal if the email exists
        return {
          success: true,
          message: 'Password reset instructions sent'
        };
      }
      
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.PASSWORD_RESET_SECRET || 'fallback_reset_secret',
        { expiresIn: '1h' }
      );
      
      // Store reset token in database
      const storeResult = await supabaseService.storePasswordResetToken(user.id, resetToken);
      if (!storeResult.success) {
        throw new Error('Failed to store password reset token');
      }
      
      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);
      
      return {
        success: true,
        message: 'Password reset instructions sent'
      };
    } catch (error: any) {
      logger.error('Forgot password error', error);
      throw error;
    }
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    try {
      logger.info('Password reset attempt', token);
      
      // Verify the reset token
      const decoded: any = jwt.verify(
        token,
        process.env.PASSWORD_RESET_SECRET || 'fallback_reset_secret'
      );
      
      // Check if token exists in database
      const tokenValid = await supabaseService.validatePasswordResetToken(decoded.userId, token);
      if (!tokenValid) {
        throw new Error('Invalid or expired reset token');
      }
      
      // Hash new password using the centralized database service
      const hashedPassword = await centralizedDatabaseService.hashPassword(newPassword);
      
      // Update password
      const updateResult = await supabaseService.updateUser(decoded.userId, { 
        password: hashedPassword 
      });
      
      if (!updateResult) {
        throw new Error('Failed to update password');
      }
      
      // Remove reset token from database
      await supabaseService.removePasswordResetToken(decoded.userId);
      
      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error: any) {
      logger.error('Reset password error', error);
      throw error;
    }
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    try {
      logger.info('Password change attempt', userId);
      
      // Get user
      const user = await supabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password using the centralized database service
      const hashedPassword = await centralizedDatabaseService.hashPassword(newPassword);
      
      // Update password
      await supabaseService.updateUser(userId, { password: hashedPassword });
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error: any) {
      logger.error('Change password error', error);
      throw error;
    }
  },
  
  enableMFA: async (userId: string) => {
    try {
      logger.info('Enable MFA', userId);
      
      // Enable MFA for the user
      const result = await mfaService.enableMFA(userId);
      
      if (!result.success) {
        throw new Error('Failed to enable MFA');
      }
      
      // Generate QR code for setup
      const user = await supabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const qrCodeDataUrl = await mfaService.generateQRCode(
        result.data.secret, 
        user.email, 
        'Brixsport'
      );
      
      // Send setup email
      await emailService.sendMFASetupEmail(user.email, qrCodeDataUrl);
      
      return {
        success: true,
        data: {
          recoveryCodes: result.data.recoveryCodes
        },
        message: 'MFA enabled successfully. Please check your email for setup instructions.'
      };
    } catch (error: any) {
      logger.error('Enable MFA error', error);
      throw error;
    }
  },
  
  disableMFA: async (userId: string) => {
    try {
      logger.info('Disable MFA', userId);
      
      // Disable MFA for the user
      const result = await mfaService.disableMFA(userId);
      
      if (!result.success) {
        throw new Error('Failed to disable MFA');
      }
      
      return {
        success: true,
        message: 'MFA disabled successfully'
      };
    } catch (error: any) {
      logger.error('Disable MFA error', error);
      throw error;
    }
  },
  
  verifyMFA: async (mfaToken: string, mfaCode: string) => {
    try {
      logger.info('Verify MFA code');
      
      // Verify temporary token
      const decoded: any = jwt.verify(
        mfaToken,
        process.env.MFA_TEMP_SECRET || 'fallback_mfa_temp'
      );
      
      // Verify MFA code
      const isValid = await mfaService.verifyToken(decoded.userId, mfaCode);
      
      if (!isValid) {
        throw new Error('Invalid MFA code');
      }
      
      // Get user
      const user = await supabaseService.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate final tokens
      const token = jwt.sign(
        { userId: decoded.userId, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: decoded.userId, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Store refresh token with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await sessionService.createRefreshSession(refreshToken, {
        userId: decoded.userId,
        createdAt: new Date(),
        expiresAt
      }, 7 * 24 * 60 * 60);
      
      // Remove sensitive information
      const { password, ...publicUser } = user;
      
      return {
        success: true,
        data: {
          user: publicUser,
          token,
          refreshToken
        },
        message: 'MFA verified successfully'
      };
    } catch (error: any) {
      logger.error('MFA verification error', error);
      throw error;
    }
  },
  
  verifyRecoveryCode: async (userId: string, recoveryCode: string) => {
    try {
      logger.info('Verify recovery code', { userId });
      
      // Verify recovery code
      const isValid = await mfaService.verifyRecoveryCode(userId, recoveryCode);
      
      if (!isValid) {
        throw new Error('Invalid recovery code');
      }
      
      // Get user
      const user = await supabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Store refresh token with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await sessionService.createRefreshSession(refreshToken, {
        userId: user.id,
        createdAt: new Date(),
        expiresAt
      }, 7 * 24 * 60 * 60);
      
      // Remove sensitive information
      const { password, ...publicUser } = user;
      
      return {
        success: true,
        data: {
          user: publicUser,
          token,
          refreshToken
        },
        message: 'Recovery code verified successfully'
      };
    } catch (error: any) {
      logger.error('Recovery code verification error', error);
      throw error;
    }
  },
  
  listSessions: async (userId: string): Promise<{ success: boolean; data: { sessions: Array<{ id: string; expiresAt: Date }> }; message: string }> => {
    try {
      logger.info('List active sessions', userId);
      
      // Get all sessions for this user
      const sessions = await sessionService.getUserSessions(userId);
      
      // Filter out expired sessions and map to response format
      const activeSessions = sessions
        .filter(session => !sessionService.isSessionExpired(session))
        .map(session => ({
          id: session.id,
          expiresAt: session.expiresAt
        }));
      
      return {
        success: true,
        data: {
          sessions: activeSessions
        },
        message: 'Sessions retrieved successfully'
      };
    } catch (error: any) {
      logger.error('List sessions error', error);
      throw error;
    }
  },
  
  revokeSession: async (userId: string, sessionId: string): Promise<{ success: boolean; message: string }> => {
    try {
      logger.info('Revoke session', { userId, sessionId });
      
      // Check if the session belongs to the user
      const session = await sessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        throw new Error('Session not found');
      }
      
      // Remove the session
      await sessionService.deleteSession(sessionId, userId);
      
      return {
        success: true,
        message: 'Session revoked successfully'
      };
    } catch (error: any) {
      logger.error('Revoke session error', error);
      throw error;
    }
  }
};