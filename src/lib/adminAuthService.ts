import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import { supabase } from './supabaseClient';
import type { AdminUser, AdminAuthResponse, AdminMfaSetup, AdminPasswordReset } from '@/types/admin';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'fallback_admin_secret'
);

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_REFRESH_TOKEN_SECRET || 'fallback_refresh_secret'
);

const PASSWORD_RESET_SECRET = new TextEncoder().encode(
  process.env.ADMIN_PASSWORD_RESET_SECRET || 'fallback_reset_secret'
);

// Token expiration times
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const MFA_TEMP_TOKEN_EXPIRY = 5 * 60; // 5 minutes
const PASSWORD_RESET_TOKEN_EXPIRY = 60 * 60; // 1 hour

// Security constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const BCRYPT_ROUNDS = 12;

/**
 * Admin Authentication Service
 * Handles all admin authentication, authorization, and security operations
 */
export const adminAuthService = {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate JWT access token
   */
  async generateAccessToken(admin: AdminUser): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ACCESS_TOKEN_EXPIRY;

    return new SignJWT({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminLevel: admin.adminLevel,
      permissions: admin.permissions,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setSubject(admin.id)
      .sign(JWT_SECRET);
  },

  /**
   * Generate JWT refresh token
   */
  async generateRefreshToken(adminId: string): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + REFRESH_TOKEN_EXPIRY;

    return new SignJWT({
      adminId,
      type: 'refresh',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setSubject(adminId)
      .sign(REFRESH_TOKEN_SECRET);
  },

  /**
   * Generate temporary MFA token
   */
  async generateMfaToken(adminId: string): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + MFA_TEMP_TOKEN_EXPIRY;

    return new SignJWT({
      adminId,
      type: 'mfa_temp',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setSubject(adminId)
      .sign(JWT_SECRET);
  },

  /**
   * Verify JWT token
   */
  async verifyToken(token: string, secret: Uint8Array = JWT_SECRET): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  },

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(
    adminId: string,
    tokenHash: string,
    deviceInfo: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + REFRESH_TOKEN_EXPIRY);

      // Hash the token before storing
      const hashedToken = await bcrypt.hash(tokenHash, 10);

      const { error } = await supabase.from('AdminRefreshToken').insert({
        admin_id: adminId,
        token_hash: hashedToken,
        ip_address: deviceInfo.ipAddress,
        user_agent: deviceInfo.userAgent,
        expires_at: expiresAt.toISOString(),
      });

      return !error;
    } catch (error) {
      console.error('Error storing refresh token:', error);
      return false;
    }
  },

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenHash: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('AdminRefreshToken')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'manual_revoke',
        })
        .eq('token_hash', tokenHash);

      return !error;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
  },

  /**
   * Check if account is locked
   */
  async isAccountLocked(adminId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('Admin')
        .select('account_locked, locked_until')
        .eq('id', adminId)
        .single();

      if (error || !data) return false;

      if (!data.account_locked) return false;

      // Check if lock has expired
      if (data.locked_until) {
        const lockExpiry = new Date(data.locked_until);
        if (lockExpiry < new Date()) {
          // Unlock the account
          await supabase
            .from('Admin')
            .update({
              account_locked: false,
              locked_until: null,
              failed_login_attempts: 0,
            })
            .eq('id', adminId);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  },

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(email: string): Promise<void> {
    try {
      const { data: admin } = await supabase
        .from('Admin')
        .select('id, failed_login_attempts')
        .eq('email', email)
        .single();

      if (!admin) return;

      const attempts = (admin.failed_login_attempts || 0) + 1;
      const updates: any = {
        failed_login_attempts: attempts,
      };

      // Lock account if max attempts reached
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);

        updates.account_locked = true;
        updates.locked_until = lockedUntil.toISOString();
      }

      await supabase.from('Admin').update(updates).eq('id', admin.id);
    } catch (error) {
      console.error('Error recording failed login:', error);
    }
  },

  /**
   * Reset failed login attempts
   */
  async resetFailedAttempts(adminId: string): Promise<void> {
    try {
      await supabase
        .from('Admin')
        .update({
          failed_login_attempts: 0,
          account_locked: false,
          locked_until: null,
        })
        .eq('id', adminId);
    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  },

  /**
   * Log admin audit event
   */
  async logAuditEvent(
    adminId: string | null,
    action: string,
    details?: any,
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical' = 'info',
    outcome: 'success' | 'failure' | 'warning' | 'error' = 'success',
    request?: Request
  ): Promise<void> {
    try {
      await supabase.from('AdminAuditLog').insert({
        admin_id: adminId,
        action,
        details,
        severity,
        outcome,
        ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
        user_agent: request?.headers.get('user-agent'),
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  },

  /**
   * Admin login
   */
  async login(
    email: string,
    password: string,
    deviceInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<AdminAuthResponse> {
    try {
      // Fetch admin from database
      const { data: admin, error } = await supabase
        .from('Admin')
        .select('*')
        .eq('email', email)
        .eq('deleted', false)
        .single();

      if (error || !admin) {
        await this.logAuditEvent(null, 'admin_login_failed', { email, reason: 'invalid_email' }, 'medium', 'failure');
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if account is locked
      if (await this.isAccountLocked(admin.id)) {
        await this.logAuditEvent(admin.id, 'admin_login_blocked', { reason: 'account_locked' }, 'high', 'failure');
        return {
          success: false,
          error: 'Account is locked. Please try again later or contact support.',
        };
      }

      // Check if account is active
      if (!admin.is_active || admin.suspended) {
        await this.logAuditEvent(admin.id, 'admin_login_blocked', { reason: 'account_inactive' }, 'medium', 'failure');
        return {
          success: false,
          error: 'Account is not active',
        };
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, admin.password_hash);
      if (!isValidPassword) {
        await this.recordFailedLogin(email);
        await this.logAuditEvent(admin.id, 'admin_login_failed', { reason: 'invalid_password' }, 'medium', 'failure');
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Reset failed attempts on successful password verification
      await this.resetFailedAttempts(admin.id);

      // Check if MFA is enabled
      if (admin.mfa_enabled) {
        const mfaToken = await this.generateMfaToken(admin.id);
        await this.logAuditEvent(admin.id, 'admin_mfa_required', {}, 'info', 'success');

        return {
          success: true,
          data: {
            admin: this.sanitizeAdmin(admin),
            token: '',
            requiresMfa: true,
            mfaToken,
          },
        };
      }

      // Generate tokens
      const accessToken = await this.generateAccessToken(this.sanitizeAdmin(admin));
      const refreshToken = await this.generateRefreshToken(admin.id);

      // Store refresh token
      await this.storeRefreshToken(admin.id, refreshToken, deviceInfo || {});

      // Update last login
      await supabase
        .from('Admin')
        .update({
          last_login: new Date().toISOString(),
          last_login_ip: deviceInfo?.ipAddress,
        })
        .eq('id', admin.id);

      await this.logAuditEvent(admin.id, 'admin_login_success', {}, 'info', 'success');

      return {
        success: true,
        data: {
          admin: this.sanitizeAdmin(admin),
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
  },

  /**
   * Sanitize admin data (remove sensitive fields)
   */
  sanitizeAdmin(admin: any): AdminUser {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminLevel: admin.admin_level,
      permissions: admin.permissions || [],
      mfaEnabled: admin.mfa_enabled,
      lastLogin: admin.last_login,
      lastLoginIp: admin.last_login_ip,
      accountLocked: admin.account_locked,
      isActive: admin.is_active,
      suspended: admin.suspended,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    };
  },

  /**
   * Verify MFA code
   */
  async verifyMfaCode(
    mfaToken: string,
    code: string,
    deviceInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<AdminAuthResponse> {
    try {
      // Verify MFA temp token
      const payload = await this.verifyToken(mfaToken);
      if (!payload || payload.type !== 'mfa_temp') {
        return {
          success: false,
          error: 'Invalid or expired MFA token',
        };
      }

      const adminId = payload.adminId as string;

      // Get admin data
      const { data: admin, error } = await supabase
        .from('Admin')
        .select('*')
        .eq('id', adminId)
        .single();

      if (error || !admin) {
        return {
          success: false,
          error: 'Admin not found',
        };
      }

      // Verify TOTP code
      const isValid = authenticator.verify({
        token: code,
        secret: admin.mfa_secret,
      });

      if (!isValid) {
        await this.logAuditEvent(adminId, 'admin_mfa_failed', {}, 'high', 'failure');
        return {
          success: false,
          error: 'Invalid MFA code',
        };
      }

      // Generate tokens
      const accessToken = await this.generateAccessToken(this.sanitizeAdmin(admin));
      const refreshToken = await this.generateRefreshToken(admin.id);

      // Store refresh token
      await this.storeRefreshToken(admin.id, refreshToken, deviceInfo || {});

      // Update last login
      await supabase
        .from('Admin')
        .update({
          last_login: new Date().toISOString(),
          last_login_ip: deviceInfo?.ipAddress,
        })
        .eq('id', admin.id);

      await this.logAuditEvent(adminId, 'admin_mfa_success', {}, 'info', 'success');

      return {
        success: true,
        data: {
          admin: this.sanitizeAdmin(admin),
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        error: 'MFA verification failed',
      };
    }
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AdminAuthResponse> {
    try {
      // Verify refresh token
      const payload = await this.verifyToken(refreshToken, REFRESH_TOKEN_SECRET);
      if (!payload || payload.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }

      const adminId = payload.adminId as string;

      // Check if token is revoked
      const hashedToken = await bcrypt.hash(refreshToken, 10);
      const { data: tokenData } = await supabase
        .from('AdminRefreshToken')
        .select('*')
        .eq('admin_id', adminId)
        .eq('revoked', false)
        .single();

      if (!tokenData) {
        return {
          success: false,
          error: 'Refresh token not found or revoked',
        };
      }

      // Get admin data
      const { data: admin, error } = await supabase
        .from('Admin')
        .select('*')
        .eq('id', adminId)
        .eq('is_active', true)
        .eq('deleted', false)
        .single();

      if (error || !admin) {
        return {
          success: false,
          error: 'Admin not found or inactive',
        };
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken(this.sanitizeAdmin(admin));

      // Update last used time
      await supabase
        .from('AdminRefreshToken')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      return {
        success: true,
        data: {
          admin: this.sanitizeAdmin(admin),
          token: accessToken,
        },
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Token refresh failed',
      };
    }
  },

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<boolean> {
    try {
      await this.revokeRefreshToken(refreshToken);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },

  /**
   * Enable MFA for admin
   */
  async enableMfa(adminId: string): Promise<AdminMfaSetup | null> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret();

      // Get admin email
      const { data: admin } = await supabase
        .from('Admin')
        .select('email')
        .eq('id', adminId)
        .single();

      if (!admin) {
        throw new Error('Admin not found');
      }

      // Generate QR code
      const otpauth = authenticator.keyuri(admin.email, 'Brixsport Admin', secret);
      const qrCode = await QRCode.toDataURL(otpauth);

      // Generate recovery codes
      const recoveryCodes: string[] = [];
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        recoveryCodes.push(code);
      }

      // Hash recovery codes before storing
      const hashedCodes = await Promise.all(
        recoveryCodes.map(code => this.hashPassword(code))
      );

      // Store in database
      await supabase
        .from('Admin')
        .update({
          mfa_secret: secret,
          mfa_recovery_codes: hashedCodes,
          mfa_enabled: true,
          mfa_enabled_at: new Date().toISOString(),
        })
        .eq('id', adminId);

      await this.logAuditEvent(adminId, 'admin_mfa_enabled', {}, 'medium', 'success');

      return {
        secret,
        qrCode,
        recoveryCodes, // Return plain codes to user (only time they'll see them)
      };
    } catch (error) {
      console.error('Enable MFA error:', error);
      return null;
    }
  },

  /**
   * Disable MFA for admin
   */
  async disableMfa(adminId: string): Promise<boolean> {
    try {
      await supabase
        .from('Admin')
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          mfa_recovery_codes: null,
        })
        .eq('id', adminId);

      await this.logAuditEvent(adminId, 'admin_mfa_disabled', {}, 'high', 'success');
      return true;
    } catch (error) {
      console.error('Disable MFA error:', error);
      return false;
    }
  },

  /**
   * Verify recovery code
   */
  async verifyRecoveryCode(
    mfaToken: string,
    recoveryCode: string,
    deviceInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<AdminAuthResponse> {
    try {
      // Verify MFA temp token
      const payload = await this.verifyToken(mfaToken);
      if (!payload || payload.type !== 'mfa_temp') {
        return {
          success: false,
          error: 'Invalid or expired MFA token',
        };
      }

      const adminId = payload.adminId as string;

      // Get admin data
      const { data: admin, error } = await supabase
        .from('Admin')
        .select('*')
        .eq('id', adminId)
        .single();

      if (error || !admin || !admin.mfa_recovery_codes) {
        return {
          success: false,
          error: 'Admin not found or no recovery codes available',
        };
      }

      // Check recovery code against hashed codes
      let isValid = false;
      let usedIndex = -1;

      for (let i = 0; i < admin.mfa_recovery_codes.length; i++) {
        if (await this.verifyPassword(recoveryCode.toUpperCase(), admin.mfa_recovery_codes[i])) {
          isValid = true;
          usedIndex = i;
          break;
        }
      }

      if (!isValid) {
        await this.logAuditEvent(adminId, 'admin_recovery_code_failed', {}, 'high', 'failure');
        return {
          success: false,
          error: 'Invalid recovery code',
        };
      }

      // Remove used recovery code
      const updatedCodes = admin.mfa_recovery_codes.filter((_: any, index: number) => index !== usedIndex);
      await supabase
        .from('Admin')
        .update({ mfa_recovery_codes: updatedCodes })
        .eq('id', adminId);

      // Generate tokens
      const accessToken = await this.generateAccessToken(this.sanitizeAdmin(admin));
      const refreshToken = await this.generateRefreshToken(admin.id);

      // Store refresh token
      await this.storeRefreshToken(admin.id, refreshToken, deviceInfo || {});

      // Update last login
      await supabase
        .from('Admin')
        .update({
          last_login: new Date().toISOString(),
          last_login_ip: deviceInfo?.ipAddress,
        })
        .eq('id', admin.id);

      await this.logAuditEvent(adminId, 'admin_recovery_code_used', {}, 'high', 'success');

      return {
        success: true,
        data: {
          admin: this.sanitizeAdmin(admin),
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      console.error('Recovery code verification error:', error);
      return {
        success: false,
        error: 'Recovery code verification failed',
      };
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: admin } = await supabase
        .from('Admin')
        .select('id, email, name')
        .eq('email', email)
        .eq('deleted', false)
        .single();

      // Don't reveal if email exists for security
      if (!admin) {
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        };
      }

      // Generate reset token
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + PASSWORD_RESET_TOKEN_EXPIRY;

      const resetToken = await new SignJWT({
        adminId: admin.id,
        email: admin.email,
        type: 'password_reset',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(PASSWORD_RESET_SECRET);

      // Store reset token in database
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + PASSWORD_RESET_TOKEN_EXPIRY);

      await supabase
        .from('Admin')
        .update({
          password_reset_token: resetToken,
          password_reset_expires: expiresAt.toISOString(),
        })
        .eq('id', admin.id);

      await this.logAuditEvent(admin.id, 'admin_password_reset_requested', {}, 'medium', 'success');

      // TODO: Send email with reset link
      // In production, integrate with email service
      console.log('Password reset token:', resetToken);
      console.log('Reset link:', `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${resetToken}`);

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: 'Failed to process password reset request',
      };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AdminPasswordReset> {
    try {
      // Verify reset token
      const payload = await this.verifyToken(token, PASSWORD_RESET_SECRET);
      if (!payload || payload.type !== 'password_reset') {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      const adminId = payload.adminId as string;

      // Get admin and verify token hasn't been used
      const { data: admin } = await supabase
        .from('Admin')
        .select('password_reset_token, password_reset_expires')
        .eq('id', adminId)
        .single();

      if (!admin || admin.password_reset_token !== token) {
        return {
          success: false,
          message: 'Invalid or already used reset token',
        };
      }

      // Check if token expired
      if (admin.password_reset_expires && new Date(admin.password_reset_expires) < new Date()) {
        return {
          success: false,
          message: 'Reset token has expired',
        };
      }

      // Validate password strength
      if (newPassword.length < 12) {
        return {
          success: false,
          message: 'Password must be at least 12 characters long',
        };
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
        return {
          success: false,
          message: 'Password must contain uppercase, lowercase, number, and special character',
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password and clear reset token
      await supabase
        .from('Admin')
        .update({
          password_hash: passwordHash,
          password_changed_at: new Date().toISOString(),
          password_reset_token: null,
          password_reset_expires: null,
          failed_login_attempts: 0,
          account_locked: false,
          locked_until: null,
        })
        .eq('id', adminId);

      // Revoke all refresh tokens for security
      await supabase
        .from('AdminRefreshToken')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: 'password_reset',
        })
        .eq('admin_id', adminId)
        .eq('revoked', false);

      await this.logAuditEvent(adminId, 'admin_password_reset_success', {}, 'high', 'success');

      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  },

  /**
   * Change password (for logged-in admin)
   */
  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AdminPasswordReset> {
    try {
      // Get admin
      const { data: admin } = await supabase
        .from('Admin')
        .select('password_hash')
        .eq('id', adminId)
        .single();

      if (!admin) {
        return {
          success: false,
          message: 'Admin not found',
        };
      }

      // Verify current password
      const isValid = await this.verifyPassword(currentPassword, admin.password_hash);
      if (!isValid) {
        await this.logAuditEvent(adminId, 'admin_password_change_failed', { reason: 'invalid_current_password' }, 'medium', 'failure');
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Validate new password
      if (newPassword.length < 12) {
        return {
          success: false,
          message: 'Password must be at least 12 characters long',
        };
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
        return {
          success: false,
          message: 'Password must contain uppercase, lowercase, number, and special character',
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password
      await supabase
        .from('Admin')
        .update({
          password_hash: passwordHash,
          password_changed_at: new Date().toISOString(),
        })
        .eq('id', adminId);

      await this.logAuditEvent(adminId, 'admin_password_changed', {}, 'medium', 'success');

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  },
};
