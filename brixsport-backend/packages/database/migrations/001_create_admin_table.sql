-- Admin Authentication System Migration
-- Creates dedicated Admin table with security features
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ADMIN TABLE
-- =============================================================================

-- Create Admin table with comprehensive security features
CREATE TABLE IF NOT EXISTS "Admin" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    admin_level VARCHAR(50) NOT NULL DEFAULT 'basic',
    permissions TEXT[] DEFAULT '{}',
    
    -- MFA Configuration
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    mfa_recovery_codes TEXT[],
    mfa_enabled_at TIMESTAMP WITH TIME ZONE,
    
    -- Security Tracking
    last_login TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Password Management
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Account Status
    is_active BOOLEAN DEFAULT TRUE,
    suspended BOOLEAN DEFAULT FALSE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspension_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    -- Soft Delete
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for Admin table
CREATE INDEX IF NOT EXISTS idx_admin_email ON "Admin"(email);
CREATE INDEX IF NOT EXISTS idx_admin_role ON "Admin"(role);
CREATE INDEX IF NOT EXISTS idx_admin_admin_level ON "Admin"(admin_level);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON "Admin"(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_deleted ON "Admin"(deleted);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_enabled ON "Admin"(mfa_enabled);
CREATE INDEX IF NOT EXISTS idx_admin_account_locked ON "Admin"(account_locked);

-- =============================================================================
-- ADMIN REFRESH TOKENS TABLE
-- =============================================================================

-- Create Admin Refresh Tokens table for secure token rotation
CREATE TABLE IF NOT EXISTS "AdminRefreshToken" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES "Admin"(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT
);

-- Create indexes for AdminRefreshToken table
CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_admin_id ON "AdminRefreshToken"(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_hash ON "AdminRefreshToken"(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_expires ON "AdminRefreshToken"(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_revoked ON "AdminRefreshToken"(revoked);

-- =============================================================================
-- ADMIN AUDIT LOG TABLE
-- =============================================================================

-- Create Admin Audit Log for tracking admin actions
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES "Admin"(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(50) DEFAULT 'info',
    outcome VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AdminAuditLog table
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON "AdminAuditLog"(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON "AdminAuditLog"(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON "AdminAuditLog"(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON "AdminAuditLog"(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_severity ON "AdminAuditLog"(severity);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for Admin table
CREATE TRIGGER update_admin_updated_at 
    BEFORE UPDATE ON "Admin" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_admin_updated_at();

-- Function to auto-revoke expired refresh tokens
CREATE OR REPLACE FUNCTION revoke_expired_admin_refresh_tokens()
RETURNS void AS $$
BEGIN
    UPDATE "AdminRefreshToken"
    SET revoked = TRUE,
        revoked_at = NOW(),
        revoked_reason = 'expired'
    WHERE expires_at < NOW()
      AND revoked = FALSE;
END;
$$ language 'plpgsql';

-- =============================================================================
-- CONSTRAINTS AND VALIDATION
-- =============================================================================

-- Add check constraints
ALTER TABLE "Admin" ADD CONSTRAINT check_admin_role 
    CHECK (role IN ('admin', 'super-admin'));

ALTER TABLE "Admin" ADD CONSTRAINT check_admin_level 
    CHECK (admin_level IN ('basic', 'super'));

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT check_audit_severity 
    CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical'));

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT check_audit_outcome 
    CHECK (outcome IN ('success', 'failure', 'warning', 'error'));

-- =============================================================================
-- TABLE COMMENTS
-- =============================================================================

COMMENT ON TABLE "Admin" IS 'Admin accounts with comprehensive security features including MFA, account locking, and audit trails';
COMMENT ON TABLE "AdminRefreshToken" IS 'Secure refresh token storage with rotation and revocation support';
COMMENT ON TABLE "AdminAuditLog" IS 'Audit trail for all admin actions and security events';

COMMENT ON COLUMN "Admin".password_hash IS 'Bcrypt hashed password (never store plain text)';
COMMENT ON COLUMN "Admin".mfa_secret IS 'TOTP secret for two-factor authentication';
COMMENT ON COLUMN "Admin".mfa_recovery_codes IS 'Hashed recovery codes for MFA backup access';
COMMENT ON COLUMN "Admin".permissions IS 'Array of permission strings for granular access control';

-- =============================================================================
-- INITIAL SUPER ADMIN (Optional - for development only)
-- =============================================================================

-- DO NOT USE IN PRODUCTION - Create initial super admin via secure process
-- This is for development/testing only
-- Password: 'ChangeMe123!' (bcrypt hash)
/*
INSERT INTO "Admin" (email, name, password_hash, role, admin_level, permissions, is_active)
VALUES (
    'admin@brixsport.com',
    'System Administrator',
    '$2b$10$rN7YMq9p.T1zOEKJZqGq3.xQY.KY9NzZLGKNZqGq3.xQY.KY9NzZL',
    'super-admin',
    'super',
    ARRAY['*'],
    TRUE
)
ON CONFLICT (email) DO NOTHING;
*/

-- =============================================================================
-- CLEANUP AND MAINTENANCE
-- =============================================================================

-- Create a scheduled job to clean up expired tokens (run periodically)
-- This is just the function - actual scheduling should be done via pg_cron or external scheduler
CREATE OR REPLACE FUNCTION cleanup_expired_admin_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM "AdminRefreshToken"
    WHERE expires_at < NOW() - INTERVAL '30 days'
      AND revoked = TRUE;
END;
$$ language 'plpgsql';
