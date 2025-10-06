-- Database Performance Optimization Script
-- Add these indexes to improve query performance for complex operations

-- ==================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==================================================

-- Index for match queries with status and date filtering
CREATE INDEX IF NOT EXISTS idx_match_status_date ON "Match" (status, "startTime");

-- Index for match queries by competition and status
CREATE INDEX IF NOT EXISTS idx_match_competition_status ON "Match" ("competitionId", status);

-- Index for match event queries by match and event type
CREATE INDEX IF NOT EXISTS idx_match_event_match_type ON "MatchEvent" ("matchId", "eventType");

-- Index for match event queries by player and match
CREATE INDEX IF NOT EXISTS idx_match_event_player_match ON "MatchEvent" ("playerId", "matchId");

-- Index for team matches (home/away) with date ordering
CREATE INDEX IF NOT EXISTS idx_match_team_date ON "Match" ("homeTeamId", "awayTeamId", "startTime");

-- Index for user session queries by user and expiration
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires ON user_sessions (user_id, expires_at);

-- Index for favorites queries by user and entity type
CREATE INDEX IF NOT EXISTS idx_favorites_user_entity ON favorites (user_id, entity_type, entity_id);

-- Index for logger activity queries by logger and timestamp
CREATE INDEX IF NOT EXISTS idx_logger_activity_logger_time ON logger_activity (logger_id, timestamp);

-- Index for conflict queries by logger and resolution status
CREATE INDEX IF NOT EXISTS idx_conflicts_logger_resolved ON conflicts (logger_id, resolved);

-- ==================================================
-- PARTIAL INDEXES FOR FREQUENT FILTERS
-- ==================================================

-- Index for active user sessions only
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (user_id, expires_at)
WHERE expires_at > NOW();

-- Index for unresolved conflicts only
CREATE INDEX IF NOT EXISTS idx_conflicts_unresolved ON conflicts (logger_id, created_at)
WHERE resolved = FALSE;

-- Index for enabled MFA only
CREATE INDEX IF NOT EXISTS idx_user_mfa_enabled_only ON user_mfa (user_id)
WHERE is_enabled = TRUE;

-- Index for unverified email tokens only
CREATE INDEX IF NOT EXISTS idx_email_verification_pending ON email_verification (user_id, expires_at)
WHERE is_used = FALSE;

-- ==================================================
-- TEXT SEARCH INDEXES
-- ==================================================

-- Full-text search index for match venues
CREATE INDEX IF NOT EXISTS idx_match_venue_search ON "Match" USING gin (to_tsvector('english', venue));

-- Full-text search index for player names
CREATE INDEX IF NOT EXISTS idx_player_name_search ON "Player" USING gin (to_tsvector('english', name));

-- Full-text search index for team names
CREATE INDEX IF NOT EXISTS idx_team_name_search ON "Team" USING gin (to_tsvector('english', name));

-- ==================================================
-- JSONB INDEXES FOR FLEXIBLE DATA
-- ==================================================

-- Index for logger activity metadata
CREATE INDEX IF NOT EXISTS idx_logger_activity_metadata ON logger_activity USING gin (metadata);

-- Index for conflict event data
CREATE INDEX IF NOT EXISTS idx_conflicts_event_data ON conflicts USING gin (event_data);

-- ==================================================
-- PERFORMANCE MONITORING QUERIES
-- ==================================================

-- Query to analyze slow queries (run this periodically)
-- SELECT query, calls, total_time, mean_time, rows
-- FROM pg_stat_statements
-- ORDER BY total_time DESC
-- LIMIT 10;

-- Query to check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Query to check table bloat
-- SELECT schemaname, tablename, n_dead_tup, n_live_tup,
--        ROUND(n_dead_tup::float / (n_live_tup + n_dead_tup) * 100, 2) as dead_percentage
-- FROM pg_stat_user_tables
-- WHERE n_dead_tup > 0
-- ORDER BY n_dead_tup DESC;
