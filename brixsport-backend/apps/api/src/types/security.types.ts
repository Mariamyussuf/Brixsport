export interface AccountStatus {
  exists: boolean;
  isActive: boolean;
  isLocked: boolean;
  requiresPasswordChange: boolean;
  requiresMFASetup: boolean;
  securityRecommendations: string[];
}

export interface MFAStatus {
  isEnabled: boolean;
  method?: 'totp' | 'sms' | 'email';
  lastVerified?: Date;
}

export interface RiskAssessment {
  isHighRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  requiresVerification: boolean;
  score: number;
}

export interface SecurityContext {
  lastLogin: Date;
  lastLoginIp: string;
  lastLoginUserAgent: string;
}

export interface SessionMetadata {
  platform: string;
  mobile: boolean;
  country: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  metadata: SessionMetadata;
  isRevoked: boolean;
}

export interface MFASetup {
  id: string;
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  qrCode?: string;
  contact?: string;
  isVerified: boolean;
}

export interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  details: Record<string, any>;
  resolved: boolean;
}

export interface LoginRiskContext {
  userId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface MFARiskContext {
  action: string;
  ip: string;
  userAgent: string;
}

export interface PermissionCheckContext {
  userId: string;
  permission: string;
  ip: string;
  userAgent: string;
}

export interface SuspiciousPermissionCheck {
  isSuspicious: boolean;
  reasons: string[];
}

export interface EncryptionResult {
  data: string;
  algorithm: string;
  keyId: string;
  expiresAt?: Date;
}

// Service Interfaces
export interface IAccountSecurityService {
  checkUserExists(userId: string): Promise<boolean>;
  getAccountStatus(userId: string): Promise<AccountStatus>;
  getMaxConcurrentSessions(userId: string): Promise<number>;
  calculateRiskScore(params: {
    userId: string;
    action: string;
    ip: string;
    userAgent: string;
  }): Promise<number>;
  assessLoginRisk(params: LoginRiskContext): Promise<RiskAssessment>;
  checkAccountStatus(userId: string): Promise<AccountStatus>;
  isCommonPassword(password: string): Promise<boolean>;
  validatePasswordStrength(password: string): Promise<PasswordValidationResult>;
  recordFailedLogin(email: string): Promise<void>;
  resetFailedLogins(email: string): Promise<void>;
  isAccountLocked(email: string): Promise<boolean>;
  sendSecurityAlert(userId: string, event: string, ip: string): Promise<void>;
}

export interface IMFAService {
  enableMFA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<MFASetup>;
  getMFAStatus(userId: string): Promise<MFAStatus>;
  isMFARequired(userId: string, context: MFARiskContext): Promise<boolean>;
  verifyMFACode(userId: string, code: string): Promise<boolean>;
  disableMFA(userId: string): Promise<void>;
  generateBackupCodes(userId: string): Promise<string[]>;
}

export interface ISessionService {
  createSession(userId: string, userAgent: string, ip: string): Promise<Session>;
  getActiveSessions(userId: string): Promise<Session[]>;
  validateSession(sessionId: string): Promise<boolean>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
}

export interface IAuthorizationService {
  hasPermission(userId: string, permission: string): Promise<boolean>;
  isSuspiciousPermissionCheck(context: PermissionCheckContext): Promise<SuspiciousPermissionCheck>;
  getRolePermissions(roleId: string): Promise<string[]>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string, roleId: string): Promise<void>;
}

export interface IEncryptionService {
  encrypt(data: string): Promise<EncryptionResult>;
  decrypt(encryptedData: EncryptionResult): Promise<string>;
  rotateKey(keyId: string): Promise<void>;
  validateKeyRotation(): Promise<boolean>;
}

export interface IAlertingService {
  sendSecurityAlert(alert: SecurityAlert): Promise<void>;
  resolveAlert(alertId: string, resolvedBy: string): Promise<void>;
  getActiveAlerts(): Promise<SecurityAlert[]>;
  subscribeToAlerts(callback: (alert: SecurityAlert) => void): void;
}

export interface IAuditService {
  logSecurityEvent(event: {
    id: string;
    userId: string;
    eventType: string;
    resource: string;
    action: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
    details: Record<string, any>;
    outcome: 'success' | 'failure';
    ip: string;
    userAgent: string;
  }): Promise<void>;
  getSecurityEvents(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      eventType?: string[];
      severity?: ('low' | 'medium' | 'high')[];
    }
  ): Promise<any[]>;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 scale
  feedback: {
    warning: string;
    suggestions: string[];
  };
}