export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super-admin';
  adminLevel: 'basic' | 'super';
  permissions: string[];
  
  // MFA Configuration
  mfaEnabled?: boolean;
  mfaVerified?: boolean;
  
  // Security Tracking
  lastLogin?: string;
  lastLoginIp?: string;
  accountLocked?: boolean;
  
  // Account Status
  isActive?: boolean;
  suspended?: boolean;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  data?: {
    admin: AdminUser;
    token: string;
    refreshToken?: string;
    requiresMfa?: boolean;
    mfaToken?: string;
  };
  error?: string;
}

export interface AdminMfaSetup {
  secret: string;
  qrCode: string;
  recoveryCodes: string[];
}

export interface AdminPasswordReset {
  success: boolean;
  message: string;
}

export type AdminPermission = 
  | '*' // Super admin - all permissions
  | 'admin.view'
  | 'admin.create'
  | 'admin.edit'
  | 'admin.delete'
  | 'users.view'
  | 'users.edit'
  | 'users.suspend'
  | 'loggers.view'
  | 'loggers.manage'
  | 'matches.view'
  | 'matches.edit'
  | 'matches.delete'
  | 'competitions.view'
  | 'competitions.edit'
  | 'competitions.delete'
  | 'analytics.view'
  | 'analytics.export'
  | 'audit.view'
  | 'settings.view'
  | 'settings.edit';
