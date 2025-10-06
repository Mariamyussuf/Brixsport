-- Improve query performance for match-related queries

DO $$
DECLARE
    match_competition_col TEXT;
    match_scheduled_col TEXT;
    match_home_col TEXT;
    match_away_col TEXT;
BEGIN
    -- Determine column naming conventions
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) THEN 'competition_id' ELSE '"competitionId"' END
    INTO match_competition_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'scheduled_at'
    ) THEN 'scheduled_at' ELSE '"startTime"' END
    INTO match_scheduled_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_team_id'
    ) THEN 'home_team_id' ELSE '"homeTeamId"' END
    INTO match_home_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_team_id'
    ) THEN 'away_team_id' ELSE '"awayTeamId"' END
    INTO match_away_col;

    -- Base indexes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_status_v3 ON "Match" (status)';
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_competition_id_v3 ON "Match" (%s);', match_competition_col);
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_sport_v3 ON "Match" (sport)';
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at_v3 ON "Match" (%s);', match_scheduled_col);

    -- Composite indexes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_status_sport_v3 ON "Match" (status, sport)';
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_competition_status_v3 ON "Match" (%s, status);', match_competition_col);

    -- Partial indexes using scheduling column
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_upcoming_v3 ON "Match" (%s) WHERE status = ''scheduled'';', match_scheduled_col);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_live_v3 ON "Match" (%s) WHERE status = ''in_progress'';', match_scheduled_col);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_recent_v3 ON "Match" (%s DESC) WHERE status = ''completed'';', match_scheduled_col);

    -- Foreign key indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_home_team_v3 ON "Match" (%s);', match_home_col);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_away_team_v3 ON "Match" (%s);', match_away_col);
END;
$$;

-- Add GIN index for full-text search on team names and competition names
-- This helps with search functionality
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_teams_name_trgm ON "Team" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_competitions_name_trgm ON "Competition" USING gin (name gin_trgm_ops);

-- Update statistics for better query planning
ANALYZE "Match";
ANALYZE "Team";
ANALYZE "Competition";

-- Add a comment to document the purpose of these indexes
COMMENT ON INDEX idx_matches_status_v3 IS 'Speeds up filtering matches by status (live/upcoming/finished)';
COMMENT ON INDEX idx_matches_competition_id_v3 IS 'Speeds up filtering matches by competition ID';
COMMENT ON INDEX idx_matches_sport_v3 IS 'Speeds up filtering matches by sport type';
COMMENT ON INDEX idx_matches_scheduled_at_v3 IS 'Speeds up sorting matches by scheduled time';
COMMENT ON INDEX idx_matches_upcoming_v3 IS 'Optimized for queries fetching upcoming matches';
COMMENT ON INDEX idx_matches_live_v3 IS 'Optimized for queries fetching live matches';
COMMENT ON INDEX idx_matches_recent_v3 IS 'Optimized for queries fetching recently completed matches';

