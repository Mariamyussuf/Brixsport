-- =============================================================================
-- LOGGER TABLE
-- =============================================================================
-- This table manages logger users for the match logging system

CREATE TABLE IF NOT EXISTS "Logger" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'logger' CHECK (role IN ('logger', 'senior-logger', 'logger-admin')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    assignedCompetitions TEXT[],
    permissions TEXT[],
    refreshToken TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lastActive TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_logger_email ON "Logger"(email);

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_logger_role ON "Logger"(role);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_logger_status ON "Logger"(status);

-- Index for refresh token lookups
CREATE INDEX IF NOT EXISTS idx_logger_refresh_token ON "Logger"(refreshToken);

-- Index for last active timestamp
CREATE INDEX IF NOT EXISTS idx_logger_last_active ON "Logger"(lastActive);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Ensure email is unique
ALTER TABLE "Logger" ADD CONSTRAINT IF NOT EXISTS unique_logger_email UNIQUE (email);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_logger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_logger_updated_at_trigger ON "Logger";
CREATE TRIGGER update_logger_updated_at_trigger 
    BEFORE UPDATE ON "Logger" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_logger_updated_at();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE "Logger" IS 'Logger users for match event logging system';
COMMENT ON COLUMN "Logger".id IS 'Unique identifier for the logger';
COMMENT ON COLUMN "Logger".name IS 'Full name of the logger';
COMMENT ON COLUMN "Logger".email IS 'Email address (unique)';
COMMENT ON COLUMN "Logger".password IS 'BCrypt hashed password';
COMMENT ON COLUMN "Logger".role IS 'Role of the logger (logger, senior-logger, logger-admin)';
COMMENT ON COLUMN "Logger".status IS 'Current status (active, suspended, inactive)';
COMMENT ON COLUMN "Logger".assignedCompetitions IS 'List of competition IDs this logger can access';
COMMENT ON COLUMN "Logger".permissions IS 'List of specific permissions for this logger';
COMMENT ON COLUMN "Logger".refreshToken IS 'Refresh token for session management';
COMMENT ON COLUMN "Logger".createdAt IS 'Timestamp when the logger was created';
COMMENT ON COLUMN "Logger".lastActive IS 'Timestamp of last activity';
COMMENT ON COLUMN "Logger".updatedAt IS 'Timestamp of last update';

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert a default admin logger if none exists
INSERT INTO "Logger" (name, email, password, role, status, permissions)
SELECT 
    'Admin Logger',
    'logger-admin@example.com',
    '$2b$10$example_hashed_password', -- This is a placeholder, should be replaced with actual bcrypt hash
    'logger-admin',
    'active',
    ARRAY['log_matches', 'log_events', 'view_players', 'view_teams', 'view_competitions', 'manage_loggers']
WHERE NOT EXISTS (
    SELECT 1 FROM "Logger" WHERE email = 'logger-admin@example.com'
);