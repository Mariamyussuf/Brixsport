-- Database Schema for Brixsport Application
-- This file contains the SQL statements to create the required tables in Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT favorites_user_entity_unique UNIQUE (user_id, entity_type, entity_id)
);

-- Create indexes for favorites table
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON favorites (entity_type, entity_id);

-- User sessions table (for Redis session storage)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT user_sessions_token_unique UNIQUE (session_token)
);

-- Create indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);

-- User MFA table
CREATE TABLE IF NOT EXISTS user_mfa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    secret_key TEXT NOT NULL,
    recovery_codes TEXT[], -- JSON array of recovery codes
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enabled_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT user_mfa_user_unique UNIQUE (user_id)
);

-- Create indexes for user_mfa table
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa (user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_enabled ON user_mfa (is_enabled);

-- Email verification table
CREATE TABLE IF NOT EXISTS email_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    CONSTRAINT email_verification_token_unique UNIQUE (verification_token)
);

-- Create indexes for email_verification table
CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification (verification_token);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification (expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification (email);

-- Password reset table
CREATE TABLE IF NOT EXISTS password_reset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    CONSTRAINT password_reset_token_unique UNIQUE (reset_token)
);

-- Create indexes for password_reset table
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset (reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset (expires_at);

-- Add foreign key constraints (if referencing tables exist)
-- Note: These constraints assume the existence of a 'users' table with id column
-- Uncomment and adjust these constraints based on your actual user table structure

/*
ALTER TABLE favorites 
ADD CONSTRAINT fk_favorites_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_sessions 
ADD CONSTRAINT fk_user_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_mfa 
ADD CONSTRAINT fk_user_mfa_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE email_verification 
ADD CONSTRAINT fk_email_verification_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE password_reset 
ADD CONSTRAINT fk_password_reset_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
*/

-- Add check constraints for data validation
ALTER TABLE favorites 
ADD CONSTRAINT chk_entity_type 
CHECK (entity_type IN ('player', 'team', 'match', 'competition', 'sport'));

-- Conflict resolution table for logger events
CREATE TABLE IF NOT EXISTS conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logger_id UUID NOT NULL,
    conflict_type VARCHAR(100) NOT NULL,
    description TEXT,
    event_data JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conflicts table
CREATE INDEX IF NOT EXISTS idx_conflicts_logger_id ON conflicts (logger_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON conflicts (resolved);
CREATE INDEX IF NOT EXISTS idx_conflicts_created_at ON conflicts (created_at);

-- Logger activity tracking table
CREATE TABLE IF NOT EXISTS logger_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logger_id UUID NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for logger_activity table
CREATE INDEX IF NOT EXISTS idx_logger_activity_logger_id ON logger_activity (logger_id);
CREATE INDEX IF NOT EXISTS idx_logger_activity_activity_type ON logger_activity (activity_type);
CREATE INDEX IF NOT EXISTS idx_logger_activity_timestamp ON logger_activity (timestamp);

-- Add comments for documentation
COMMENT ON TABLE favorites IS 'User favorite entities (players, teams, matches, etc.)';
COMMENT ON TABLE user_sessions IS 'User session tokens for authentication';
COMMENT ON TABLE user_mfa IS 'User Multi-Factor Authentication configuration';
COMMENT ON TABLE email_verification IS 'Email verification tokens for user registration';
COMMENT ON TABLE password_reset IS 'Password reset tokens for account recovery';
COMMENT ON TABLE conflicts IS 'Conflict resolution records for logger events';
COMMENT ON TABLE logger_activity IS 'Activity tracking for logger users';