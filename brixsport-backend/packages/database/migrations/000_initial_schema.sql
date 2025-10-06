-- Initial Schema Migration
-- This migration creates all core tables for the Brixsport platform
-- Based on the comprehensive Prisma schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================================================
-- CORE USER MANAGEMENT
-- =============================================================================

-- User model with GDPR compliance
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar TEXT,
    preferences JSONB,
    notification_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suspended BOOLEAN DEFAULT FALSE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    
    -- GDPR Compliance fields
    data_processing_consent BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    data_retention_expiry TIMESTAMP WITH TIME ZONE,
    anonymized BOOLEAN DEFAULT FALSE,
    
    -- Soft delete
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for User table
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_name ON "User"(name);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_deleted ON "User"(deleted);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"(created_at);

-- Session model with enhanced security
CREATE TABLE IF NOT EXISTS "Session" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for Session table
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "Session"(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON "Session"(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_revoked ON "Session"(revoked);

-- =============================================================================
-- SPORTS HIERARCHY
-- =============================================================================

-- Season/League hierarchy
CREATE TABLE IF NOT EXISTS "Season" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Season table
CREATE INDEX IF NOT EXISTS idx_season_year ON "Season"(year);
CREATE INDEX IF NOT EXISTS idx_season_status ON "Season"(status);
CREATE INDEX IF NOT EXISTS idx_season_dates ON "Season"(start_date, end_date);

-- Competition model
CREATE TABLE IF NOT EXISTS "Competition" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES "Season"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'league', 'cup', 'tournament'
    format VARCHAR(100), -- 'round_robin', 'knockout', 'group_stage'
    status VARCHAR(50) DEFAULT 'upcoming',
    start_date DATE,
    end_date DATE,
    prize_pool DECIMAL(15,2),
    rules JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Competition table
CREATE INDEX IF NOT EXISTS idx_competition_season_id ON "Competition"(season_id);
CREATE INDEX IF NOT EXISTS idx_competition_type ON "Competition"(type);
CREATE INDEX IF NOT EXISTS idx_competition_status ON "Competition"(status);

-- Team model
CREATE TABLE IF NOT EXISTS "Team" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(10),
    logo_url TEXT,
    founded_year INTEGER,
    stadium VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(100),
    website TEXT,
    social_media JSONB,
    colors JSONB, -- {primary: '#color', secondary: '#color'}
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for Team table
CREATE INDEX IF NOT EXISTS idx_team_name ON "Team"(name);
CREATE INDEX IF NOT EXISTS idx_team_short_name ON "Team"(short_name);
CREATE INDEX IF NOT EXISTS idx_team_city ON "Team"(city);
CREATE INDEX IF NOT EXISTS idx_team_country ON "Team"(country);
CREATE INDEX IF NOT EXISTS idx_team_verified ON "Team"(verified);
CREATE INDEX IF NOT EXISTS idx_team_deleted ON "Team"(deleted);

-- Player model
CREATE TABLE IF NOT EXISTS "Player" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES "Team"(id) ON DELETE SET NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    jersey_number INTEGER,
    position VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    height_cm INTEGER,
    weight_kg INTEGER,
    photo_url TEXT,
    bio TEXT,
    social_media JSONB,
    market_value DECIMAL(15,2),
    contract_until DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'injured', 'suspended', 'retired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for Player table
CREATE INDEX IF NOT EXISTS idx_player_team_id ON "Player"(team_id);
CREATE INDEX IF NOT EXISTS idx_player_name ON "Player"(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_player_position ON "Player"(position);
CREATE INDEX IF NOT EXISTS idx_player_nationality ON "Player"(nationality);
CREATE INDEX IF NOT EXISTS idx_player_status ON "Player"(status);
CREATE INDEX IF NOT EXISTS idx_player_deleted ON "Player"(deleted);

-- =============================================================================
-- MATCH SYSTEM
-- =============================================================================

-- Match model
CREATE TABLE IF NOT EXISTS "Match" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES "Competition"(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES "Team"(id) ON DELETE RESTRICT,
    away_team_id UUID NOT NULL REFERENCES "Team"(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    round VARCHAR(100),
    matchday INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished', 'postponed', 'cancelled'
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    home_score_ht INTEGER DEFAULT 0, -- Half-time score
    away_score_ht INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    referee VARCHAR(255),
    attendance INTEGER,
    weather JSONB,
    match_data JSONB, -- Additional match statistics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
DECLARE
    has_competition_id BOOLEAN;
    has_home_team_id BOOLEAN;
    has_away_team_id BOOLEAN;
    has_scheduled_at BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) INTO has_competition_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_team_id'
    ) INTO has_home_team_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_team_id'
    ) INTO has_away_team_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'scheduled_at'
    ) INTO has_scheduled_at;

    IF has_competition_id THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_competition_id ON "Match"(competition_id)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_competition_id ON "Match"("competitionId")';
    END IF;

    IF has_home_team_id THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_home_team_id ON "Match"(home_team_id)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_home_team_id ON "Match"("homeTeamId")';
    END IF;

    IF has_away_team_id THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_away_team_id ON "Match"(away_team_id)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_away_team_id ON "Match"("awayTeamId")';
    END IF;

    IF has_scheduled_at THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_scheduled_at ON "Match"(scheduled_at)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_scheduled_at ON "Match"("startTime")';
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_status ON "Match"(status)';

    IF has_home_team_id AND has_away_team_id THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_teams ON "Match"(home_team_id, away_team_id)';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_match_teams ON "Match"("homeTeamId", "awayTeamId")';
    END IF;
END;
$$;

-- =============================================================================
-- STATISTICS AND ANALYTICS
-- =============================================================================

-- Player Statistics
CREATE TABLE IF NOT EXISTS "PlayerStatistics" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
    match_id UUID REFERENCES "Match"(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES "Competition"(id) ON DELETE CASCADE,
    season_id UUID REFERENCES "Season"(id) ON DELETE CASCADE,
    
    -- Basic stats
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    
    -- Advanced stats (JSON for flexibility)
    detailed_stats JSONB,
    
    -- Metadata
    stat_type VARCHAR(50) DEFAULT 'match', -- 'match', 'season', 'competition'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for PlayerStatistics table
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON "PlayerStatistics"(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match_id ON "PlayerStatistics"(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_competition_id ON "PlayerStatistics"(competition_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_season_id ON "PlayerStatistics"(season_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_type ON "PlayerStatistics"(stat_type);

-- Team Statistics
CREATE TABLE IF NOT EXISTS "TeamStatistics" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
    match_id UUID REFERENCES "Match"(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES "Competition"(id) ON DELETE CASCADE,
    season_id UUID REFERENCES "Season"(id) ON DELETE CASCADE,
    
    -- Basic stats
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    
    -- Advanced stats
    detailed_stats JSONB,
    
    -- Metadata
    stat_type VARCHAR(50) DEFAULT 'match', -- 'match', 'season', 'competition'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for TeamStatistics table
CREATE INDEX IF NOT EXISTS idx_team_stats_team_id ON "TeamStatistics"(team_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_match_id ON "TeamStatistics"(match_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_competition_id ON "TeamStatistics"(competition_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_season_id ON "TeamStatistics"(season_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_type ON "TeamStatistics"(stat_type);

-- =============================================================================
-- USER INTERACTIONS
-- =============================================================================

-- Favorites system
CREATE TABLE IF NOT EXISTS "Favorite" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'team', 'player', 'competition'
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Favorite table
CREATE INDEX IF NOT EXISTS idx_favorite_user_id ON "Favorite"(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_entity ON "Favorite"(entity_type, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_unique ON "Favorite"(user_id, entity_type, entity_id);

-- Followed Players
CREATE TABLE IF NOT EXISTS "FollowedPlayer" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for FollowedPlayer table
CREATE INDEX IF NOT EXISTS idx_followed_player_user_id ON "FollowedPlayer"(user_id);
CREATE INDEX IF NOT EXISTS idx_followed_player_player_id ON "FollowedPlayer"(player_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_followed_player_unique ON "FollowedPlayer"(user_id, player_id);

-- =============================================================================
-- CONTENT MANAGEMENT
-- =============================================================================

-- Articles/News
CREATE TABLE IF NOT EXISTS "Article" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    category VARCHAR(100),
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    published_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for Article table
CREATE INDEX IF NOT EXISTS idx_article_author_id ON "Article"(author_id);
CREATE INDEX IF NOT EXISTS idx_article_slug ON "Article"(slug);
CREATE INDEX IF NOT EXISTS idx_article_category ON "Article"(category);
CREATE INDEX IF NOT EXISTS idx_article_status ON "Article"(status);
CREATE INDEX IF NOT EXISTS idx_article_published_at ON "Article"(published_at);
CREATE INDEX IF NOT EXISTS idx_article_tags ON "Article" USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_article_deleted ON "Article"(deleted);

-- =============================================================================
-- SYSTEM TABLES
-- =============================================================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AuditLog table
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON "AuditLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog"(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON "AuditLog"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON "AuditLog"(created_at);

-- System Settings
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for SystemSetting table
CREATE INDEX IF NOT EXISTS idx_system_setting_key ON "SystemSetting"(key);
CREATE INDEX IF NOT EXISTS idx_system_setting_category ON "SystemSetting"(category);
CREATE INDEX IF NOT EXISTS idx_system_setting_public ON "SystemSetting"(is_public);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_season_updated_at BEFORE UPDATE ON "Season" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competition_updated_at BEFORE UPDATE ON "Competition" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_updated_at BEFORE UPDATE ON "Team" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_updated_at BEFORE UPDATE ON "Player" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_match_updated_at BEFORE UPDATE ON "Match" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_statistics_updated_at BEFORE UPDATE ON "PlayerStatistics" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_statistics_updated_at BEFORE UPDATE ON "TeamStatistics" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_article_updated_at BEFORE UPDATE ON "Article" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_setting_updated_at BEFORE UPDATE ON "SystemSetting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA AND CONSTRAINTS
-- =============================================================================

-- Add check constraints
ALTER TABLE "User" ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'admin', 'moderator', 'analyst'));
ALTER TABLE "Season" ADD CONSTRAINT check_season_dates CHECK (start_date < end_date);
ALTER TABLE "Competition" ADD CONSTRAINT check_competition_type CHECK (type IN ('league', 'cup', 'tournament'));
DO $$
DECLARE
    has_home_team_id BOOLEAN;
    has_away_team_id BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_match_teams'
          AND table_name = 'Match'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_team_id'
    ) INTO has_home_team_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_team_id'
    ) INTO has_away_team_id;

    IF has_home_team_id AND has_away_team_id THEN
        EXECUTE 'ALTER TABLE "Match" ADD CONSTRAINT check_match_teams CHECK (home_team_id != away_team_id)';
    ELSE
        EXECUTE 'ALTER TABLE "Match" ADD CONSTRAINT check_match_teams CHECK ("homeTeamId" != "awayTeamId")';
    END IF;
END;
$$;
ALTER TABLE "Match" ADD CONSTRAINT check_match_status CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled'));
ALTER TABLE "Player" ADD CONSTRAINT check_player_jersey_number CHECK (jersey_number > 0 AND jersey_number <= 99);
ALTER TABLE "Article" ADD CONSTRAINT check_article_status CHECK (status IN ('draft', 'published', 'archived'));

-- Add table comments for documentation
COMMENT ON TABLE "User" IS 'Core user accounts with GDPR compliance and soft delete support';
COMMENT ON TABLE "Session" IS 'User authentication sessions with security tracking';
COMMENT ON TABLE "Season" IS 'Sports seasons/leagues organization';
COMMENT ON TABLE "Competition" IS 'Competitions within seasons (leagues, cups, tournaments)';
COMMENT ON TABLE "Team" IS 'Sports teams with comprehensive metadata';
COMMENT ON TABLE "Player" IS 'Individual players with detailed profiles and statistics';
COMMENT ON TABLE "Match" IS 'Individual matches with comprehensive tracking';
COMMENT ON TABLE "PlayerStatistics" IS 'Player performance statistics at various levels';
COMMENT ON TABLE "TeamStatistics" IS 'Team performance statistics and standings';
COMMENT ON TABLE "Favorite" IS 'User favorites system for teams, players, competitions';
COMMENT ON TABLE "FollowedPlayer" IS 'User-specific player following system';
COMMENT ON TABLE "Article" IS 'Content management for news and articles';
COMMENT ON TABLE "AuditLog" IS 'System-wide audit trail for security and compliance';
COMMENT ON TABLE "SystemSetting" IS 'Application configuration and settings';

-- Insert default system settings
INSERT INTO "SystemSetting" (key, value, description, category, is_public) VALUES
('app.name', '"Brixsport"', 'Application name', 'general', true),
('app.version', '"1.0.0"', 'Application version', 'general', true),
('app.maintenance_mode', 'false', 'Enable maintenance mode', 'general', false),
('analytics.enabled', 'true', 'Enable analytics tracking', 'analytics', false),
('notifications.enabled', 'true', 'Enable notifications system', 'notifications', false),
('cache.ttl_minutes', '60', 'Default cache TTL in minutes', 'performance', false),
('rate_limit.requests_per_minute', '100', 'API rate limit per minute', 'security', false),
('security.session_timeout_hours', '24', 'Session timeout in hours', 'security', false)
ON CONFLICT (key) DO NOTHING;
