import { Session as BaseSession, MFASetup as BaseMFASetup, SecurityAlert as BaseSecurityAlert } from '../../types/security.types';

// Extended Session interface for security services
export interface Session extends BaseSession {
  userAgent: string;
  ip: string;
  createdAt: Date;
  lastActivity: Date;
}

// Create a compatible Session interface that includes all required properties
export interface SecuritySession {
  id: string;
  userId: string;
  userAgent: string;
  ip: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  token?: string;
  metadata?: {
    platform: string;
    mobile: boolean;
    country: string;
  };
  isRevoked?: boolean;
}

// Extended MFASetup interface for security services
export interface MFASetup extends BaseMFASetup {
  contact?: string;
}

// Extended SecurityAlert interface for security services (with additional severity level)
export interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface RefreshTokenSession {
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionMetadata {
  platform: string;
  mobile: boolean;
  country: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}