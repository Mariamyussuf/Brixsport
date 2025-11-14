import { logger } from '../../utils/logger';
import * as bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { supabaseService } from '../supabase.service';
import { redisService } from '../redis.service';
import { prisma } from '../../lib/prisma';
import { 
  AccountStatus,
  IAccountSecurityService,
  LoginRiskContext,
  PasswordValidationResult,
  RiskAssessment
} from '../../types/security.types';
import { DatabaseError } from '../../types/errors';

class AccountSecurityService implements IAccountSecurityService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION = 15 * 60; // 15 minutes in seconds
  private readonly commonPasswords: Set<string>;

  constructor() {
    // Initialize common passwords set
    this.commonPasswords = new Set([
      '123456', 'password', 'qwerty', 'abc123',
      // Add more common passwords...
    ]);
  }

  async updateUserSecurity(userId: string, securityData: { isLocked?: boolean; requiresPasswordChange?: boolean; maxSessions?: number }): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user's security JSON field
    // Since the UserSecurity model is not being generated properly, we'll create/update it directly
    await prisma.$executeRaw`INSERT INTO "UserSecurity" ("userId", "lockoutUntil") 
      VALUES (${userId}, ${securityData.isLocked ? new Date(Date.now() + this.LOCK_DURATION * 1000) : null})
      ON CONFLICT ("userId") 
      DO UPDATE SET "lockoutUntil" = ${securityData.isLocked ? new Date(Date.now() + this.LOCK_DURATION * 1000) : null}`;
  }

  async checkUserExists(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      return !!user;
    } catch (error) {
      logger.error('Error checking user existence:', error);
      throw new DatabaseError('Failed to check user existence');
    }
  }

  async checkAccountStatus(userId: string): Promise<AccountStatus> {
    return this.getAccountStatus(userId);
  }

  async getAccountStatus(userId: string): Promise<AccountStatus> {
    try {
      // Get user with security events (this one is working)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          securityEvents: true
        }
      });

      if (!user) {
        return {
          exists: false,
          isActive: false,
          isLocked: false,
          requiresPasswordChange: false,
          requiresMFASetup: false,
          securityRecommendations: []
        };
      }

      // Get user security data separately since the relation is not working
      const userSecurity: any[] = await prisma.$queryRaw`SELECT * FROM "UserSecurity" WHERE "userId" = ${userId} LIMIT 1` as any[];
      const mfaSettings: any[] = await prisma.$queryRaw`SELECT * FROM "MFASettings" WHERE "userId" = ${userId} LIMIT 1` as any[];

      const recommendations = await this.generateSecurityRecommendations(user);
      
      return {
        exists: true,
        isActive: !user.suspended,
        isLocked: userSecurity && userSecurity[0] && userSecurity[0].lockoutUntil ? userSecurity[0].lockoutUntil > new Date() : false,
        requiresPasswordChange: userSecurity && userSecurity[0] && userSecurity[0].requirePasswordChange || false,
        requiresMFASetup: !mfaSettings || !mfaSettings[0] || !mfaSettings[0].enabled,
        securityRecommendations: recommendations
      };
    } catch (error) {
      logger.error('Error getting account status:', error);
      throw new DatabaseError('Failed to get account status');
    }
  }

  async getMaxConcurrentSessions(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true
        }
      });

      if (!user) {
        return 1; // Default limit for non-existent users
      }

      // Get user security data separately since the relation is not working
      const userSecurity: any[] = await prisma.$queryRaw`SELECT * FROM "UserSecurity" WHERE "userId" = ${userId} LIMIT 1` as any[];

      const sessionLimits: Record<string, number> = {
        admin: 10,
        premium: 5,
        basic: 3,
        free: 1
      };
      
      // Use security settings if defined, otherwise use role-based limits
      if (userSecurity && userSecurity[0] && userSecurity[0].maxSessions !== undefined) {
        return userSecurity[0].maxSessions;
      }
      
      return sessionLimits[user.role] || 2; // Default to 2 sessions for unknown roles
    } catch (error) {
      logger.error('Error getting max concurrent sessions:', error);
      throw new DatabaseError('Failed to get max concurrent sessions');
    }
  }

  async calculateRiskScore(params: {
    userId: string;
    action: string;
    ip: string;
    userAgent: string;
  }): Promise<number> {
    try {
      const { userId, action, ip, userAgent } = params;

      // Get user's security history
      const securityHistory = await prisma.securityEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      let riskScore = 0;

      // Calculate various risk factors
      const locationRisk = await this.calculateLocationRisk(userId, ip);
      const deviceRisk = await this.calculateDeviceRisk(userId, userAgent);
      const timeBasedRisk = this.calculateTimeBasedRisk(securityHistory);
      const behaviorRisk = this.calculateBehaviorRisk(securityHistory, action);
      const sensitiveActionRisk = this.calculateSensitiveActionRisk(action);

      // Weight and combine risk factors
      riskScore += locationRisk * 0.3; // 30% weight
      riskScore += deviceRisk * 0.2;   // 20% weight
      riskScore += timeBasedRisk * 0.2; // 20% weight
      riskScore += behaviorRisk * 0.2;  // 20% weight
      riskScore += sensitiveActionRisk * 0.1; // 10% weight

      // Normalize score between 0 and 1
      return Math.min(Math.max(riskScore, 0), 1);
    } catch (error) {
      logger.error('Error calculating risk score:', error);
      throw new DatabaseError('Failed to calculate risk score');
    }
  }

  async assessLoginRisk(params: LoginRiskContext): Promise<RiskAssessment> {
    try {
      const { userId, ip, userAgent, timestamp } = params;
      const riskScore = await this.calculateRiskScore({ 
        userId, 
        action: 'login',
        ip,
        userAgent 
      });

      const riskFactors = await this.identifyRiskFactors(userId, ip, userAgent);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (riskScore > 0.7) riskLevel = 'high';
      else if (riskScore > 0.4) riskLevel = 'medium';
      else riskLevel = 'low';

      return {
        isHighRisk: riskScore > 0.7,
        riskLevel,
        riskFactors,
        requiresVerification: riskScore > 0.7 || riskFactors.length > 2,
        score: riskScore
      };
    } catch (error) {
      logger.error('Error assessing login risk:', error);
      throw new DatabaseError('Failed to assess login risk');
    }
  }

  async recordFailedLogin(email: string): Promise<void> {
    try {
      const key = `failed_login:${email}`;
      const attempts = await redisService.incr(key);
      
      if (attempts === 1) {
        await redisService.expire(key, this.LOCK_DURATION);
      }
      
      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        await this.lockAccount(email);
      }
    } catch (error) {
      logger.error('Error recording failed login:', error);
      throw new DatabaseError('Failed to record failed login');
    }
  }

  async resetFailedLogins(email: string): Promise<void> {
    try {
      await redisService.del(`failed_login:${email}`);
    } catch (error) {
      logger.error('Error resetting failed logins:', error);
      throw new DatabaseError('Failed to reset failed logins');
    }
  }

  async isAccountLocked(email: string): Promise<boolean> {
    try {
      const attempts = await redisService.get(`failed_login:${email}`);
      return parseInt(attempts || '0') >= this.MAX_LOGIN_ATTEMPTS;
    } catch (error) {
      logger.error('Error checking account lock:', error);
      throw new DatabaseError('Failed to check account lock status');
    }
  }

  async isCommonPassword(password: string): Promise<boolean> {
    return this.commonPasswords.has(password.toLowerCase());
  }

  async validatePasswordStrength(password: string): Promise<PasswordValidationResult> {
    try {
      // Use zxcvbn for comprehensive password strength analysis
      const result = zxcvbn(password);

      const suggestions = [...result.feedback.suggestions];
      let warning = result.feedback.warning;

      // Add custom security checks
      if (this.commonPasswords.has(password.toLowerCase())) {
        warning = 'This is a commonly used password';
        suggestions.push('Choose a unique password not found in common password lists');
      }

      if (!/[A-Z]/.test(password)) {
        suggestions.push('Add uppercase letters for stronger security');
      }

      if (!/[0-9]/.test(password)) {
        suggestions.push('Include numbers for better security');
      }

      if (!/[^A-Za-z0-9]/.test(password)) {
        suggestions.push('Add special characters to strengthen the password');
      }

      return {
        isValid: result.score >= 3,
        score: result.score,
        feedback: {
          warning: warning || '',
          suggestions
        }
      };
    } catch (error) {
      logger.error('Error validating password strength:', error);
      throw new DatabaseError('Failed to validate password strength');
    }
  }

  async sendSecurityAlert(userId: string, event: string, ip: string): Promise<void> {
    try {
      // Create security alert separately since the model is not being generated
      await prisma.$executeRaw`INSERT INTO "SecurityAlert" ("userId", "alertType", "message", "severity", "metadata")
        VALUES (${userId}, ${event}, ${`Security event: ${event}`}, 'warning', ${JSON.stringify({ ip })})`;
    } catch (error) {
      logger.error('Error sending security alert:', error);
      throw new DatabaseError('Failed to send security alert');
    }
  }

  private async lockAccount(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update or create userSecurity record using raw SQL since the model is not being generated
      await prisma.$executeRaw`INSERT INTO "UserSecurity" ("userId", "lockoutUntil")
        VALUES (${user.id}, ${new Date(Date.now() + this.LOCK_DURATION * 1000)})
        ON CONFLICT ("userId")
        DO UPDATE SET "lockoutUntil" = ${new Date(Date.now() + this.LOCK_DURATION * 1000)}`;
    } catch (error) {
      logger.error('Error locking account:', error);
      throw new DatabaseError('Failed to lock account');
    }
  }

  private async calculateLocationRisk(userId: string, ip: string): Promise<number> {
    // Implementation of location-based risk calculation
    return 0;
  }

  private async calculateDeviceRisk(userId: string, userAgent: string): Promise<number> {
    // Implementation of device-based risk calculation
    return 0;
  }

  private calculateTimeBasedRisk(securityHistory: any[]): number {
    // Implementation of time-based risk calculation
    return 0;
  }

  private calculateBehaviorRisk(securityHistory: any[], action: string): number {
    // Implementation of behavior-based risk calculation
    return 0;
  }

  private calculateSensitiveActionRisk(action: string): number {
    const sensitiveActions = new Set([
      'change_password',
      'update_security_settings',
      'disable_mfa',
      'change_email',
      'delete_account'
    ]);

    return sensitiveActions.has(action) ? 0.8 : 0;
  }

  private async identifyRiskFactors(
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<string[]> {
    const riskFactors: string[] = [];

    // Implementation of risk factor identification
    return riskFactors;
  }

  private async generateSecurityRecommendations(user: any): Promise<string[]> {
    const recommendations: string[] = [];

    // Implementation of security recommendations generation
    return recommendations;
  }
}

export const accountSecurityService = new AccountSecurityService();