-- Migration Runner Script
-- This script runs all migrations in the correct order and tracks migration status

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    checksum VARCHAR(64) -- For migration file integrity checking
);

-- Create indexes for migration_history
CREATE INDEX IF NOT EXISTS idx_migration_history_name ON migration_history(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON migration_history(executed_at);

-- Function to record migration execution
CREATE OR REPLACE FUNCTION record_migration(
    p_migration_name VARCHAR,
    p_execution_time_ms INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_checksum VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO migration_history (migration_name, execution_time_ms, success, error_message, checksum)
    VALUES (p_migration_name, p_execution_time_ms, p_success, p_error_message, p_checksum)
    ON CONFLICT (migration_name) 
    DO UPDATE SET
        executed_at = NOW(),
        execution_time_ms = EXCLUDED.execution_time_ms,
        success = EXCLUDED.success,
        error_message = EXCLUDED.error_message,
        checksum = EXCLUDED.checksum;
END;
$$ LANGUAGE plpgsql;

-- Function to check if migration has been run
CREATE OR REPLACE FUNCTION migration_executed(p_migration_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    executed BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM migration_history 
        WHERE migration_name = p_migration_name AND success = TRUE
    ) INTO executed;
    
    RETURN executed;
END;
$$ LANGUAGE plpgsql;

-- Function to get migration status
CREATE OR REPLACE FUNCTION get_migration_status()
RETURNS TABLE(
    migration_name VARCHAR,
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mh.migration_name,
        mh.executed_at,
        mh.execution_time_ms,
        mh.success,
        mh.error_message
    FROM migration_history mh
    ORDER BY mh.migration_name;
END;
$$ LANGUAGE plpgsql;

-- Migration execution instructions
/*
To run migrations manually, execute the following files in order:

1. 000_initial_schema.sql - Core database schema with all base tables
2. 001_add_activity_logging_and_chat.sql - User activity logging and chat system
3. 002_performance_optimization.sql - Performance optimization and caching
4. 003_analytics_enhancements.sql - Advanced analytics and retention tracking
5. 004_security_audit.sql - Security features and audit trails
6. 005_notifications_messaging.sql - Notifications and messaging system
7. 006_media_content.sql - Media management and content system
8. 007_advanced_features.sql - Advanced features (webhooks, feature flags, etc.)
9. 008_add_user_roles.sql - Add user roles and permissions
10. 009_add_user_settings.sql - Add user settings table
11. 010_add_user_profile.sql - Add user profile table
12. 011_add_user_activity.sql - Add user activity table
13. 012_add_user_notifications.sql - Add user notifications table
14. 013_add_user_messages.sql - Add user messages table
15. 014_add_user_media.sql - Add user media table
16. 015_add_user_features.sql - Add user features table
17. 016_add_user_security.sql - Add user security table
18. 017_add_user_analytics.sql - Add user analytics table
19. 018_add_user_chat.sql - Add user chat table
20. 019_add_user_performance.sql - Add user performance table
21. 020_add_user_retention.sql - Add user retention table
22. 021_add_user_notifications_messaging.sql - Add user notifications and messaging table
23. 022_add_user_media_content.sql - Add user media and content table
24. 023_add_user_advanced_features.sql - Add user advanced features table
25. 024_add_player_weight_column.sql - Add weight column to Player table
26. 025_add_missing_player_columns.sql - Add missing columns to Player table
27. 026_sync_competition_table_with_prisma_schema.sql - Sync Competition table with Prisma schema
28. 027_add_match_importance_column.sql - Add importance column to Match table

After running each migration, record it using:
SELECT record_migration('migration_name', execution_time_ms, success, error_message);

Example:
SELECT record_migration('000_initial_schema', 2500, TRUE, NULL);
*/

-- Verify all required extensions are installed
DO $$
BEGIN
    -- Check for required extensions
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE NOTICE 'Installing uuid-ossp extension...';
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        RAISE NOTICE 'Installing pg_trgm extension...';
        CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gin') THEN
        RAISE NOTICE 'Installing btree_gin extension...';
        CREATE EXTENSION IF NOT EXISTS "btree_gin";
    END IF;
    
    RAISE NOTICE 'All required extensions are available.';
END $$;

-- Create a view for easy migration status checking
CREATE OR REPLACE VIEW migration_status_view AS
SELECT 
    migration_name,
    executed_at,
    CASE 
        WHEN execution_time_ms IS NOT NULL THEN execution_time_ms || 'ms'
        ELSE 'N/A'
    END as execution_time,
    CASE 
        WHEN success THEN '✓ Success'
        ELSE '✗ Failed'
    END as status,
    COALESCE(error_message, 'No errors') as error_info
FROM migration_history
ORDER BY migration_name;

-- Insert initial migration records if running for the first time
INSERT INTO migration_history (migration_name, success, error_message) VALUES
('000_initial_schema', FALSE, 'Not executed - run manually'),
('001_add_activity_logging_and_chat', FALSE, 'Not executed - run manually'),
('002_performance_optimization', FALSE, 'Not executed - run manually'),
('003_analytics_enhancements', FALSE, 'Not executed - run manually'),
('004_security_audit', FALSE, 'Not executed - run manually'),
('005_notifications_messaging', FALSE, 'Not executed - run manually'),
('006_media_content', FALSE, 'Not executed - run manually'),
('007_advanced_features', FALSE, 'Not executed - run manually'),
('026_sync_competition_table_with_prisma_schema', FALSE, 'Not executed - run manually'),
('027_add_match_importance_column', FALSE, 'Not executed - run manually')
ON CONFLICT (migration_name) DO NOTHING;

-- Display current migration status
SELECT 'Current Migration Status:' as info;
SELECT * FROM migration_status_view;

-- Display helpful information
SELECT 'Migration files are located in the migrations directory.' as info
UNION ALL
SELECT 'Run each migration file manually in the order specified above.' as info
UNION ALL
SELECT 'After running each migration, update its status using record_migration().' as info
UNION ALL
SELECT 'Use get_migration_status() to check the current status of all migrations.' as info;

COMMENT ON TABLE migration_history IS 'Tracks the execution status of database migrations';
COMMENT ON FUNCTION record_migration IS 'Records the execution of a database migration';
COMMENT ON FUNCTION migration_executed IS 'Checks if a specific migration has been successfully executed';
COMMENT ON FUNCTION get_migration_status IS 'Returns the status of all migrations';
COMMENT ON VIEW migration_status_view IS 'User-friendly view of migration execution status';
