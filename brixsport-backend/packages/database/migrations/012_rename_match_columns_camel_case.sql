-- Rename Match table columns to camelCase to align with Prisma schema

BEGIN;

-- Rename core foreign key columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competitionId'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN competition_id TO "competitionId"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_team_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'homeTeamId'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN home_team_id TO "homeTeamId"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_team_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'awayTeamId'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN away_team_id TO "awayTeamId"';
    END IF;
END;
$$;

-- Rename scheduling and timing columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'scheduled_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'startTime'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN scheduled_at TO "startTime"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'started_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'startedAt'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN started_at TO "startedAt"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'finished_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'finishedAt'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN finished_at TO "finishedAt"';
    END IF;
END;
$$;

-- Rename score columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_score'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'homeScore'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN home_score TO "homeScore"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_score'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'awayScore'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN away_score TO "awayScore"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_score_ht'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'homeScoreHt'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN home_score_ht TO "homeScoreHt"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_score_ht'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'awayScoreHt'
    ) THEN
        EXECUTE 'ALTER TABLE "Match" RENAME COLUMN away_score_ht TO "awayScoreHt"';
    END IF;
END;
$$;

-- Update existing indexes to follow new column names
ALTER INDEX IF EXISTS idx_match_competition_id RENAME TO idx_match_competitionId;
ALTER INDEX IF EXISTS idx_match_home_team_id RENAME TO idx_match_homeTeamId;
ALTER INDEX IF EXISTS idx_match_away_team_id RENAME TO idx_match_awayTeamId;
ALTER INDEX IF EXISTS idx_match_scheduled_at RENAME TO idx_match_startTime;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_matches_competition_v2'
    ) THEN
        EXECUTE 'ALTER INDEX idx_matches_competition_v2 RENAME TO idx_matches_competitionId_v2';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_matches_competition_id_v3'
    ) THEN
        EXECUTE 'ALTER INDEX idx_matches_competition_id_v3 RENAME TO idx_matches_competitionId_v3';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_matches_home_team_v3'
    ) THEN
        EXECUTE 'ALTER INDEX idx_matches_home_team_v3 RENAME TO idx_matches_homeTeam_v3';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_matches_away_team_v3'
    ) THEN
        EXECUTE 'ALTER INDEX idx_matches_away_team_v3 RENAME TO idx_matches_awayTeam_v3';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'idx_matches_scheduled_at_v3'
    ) THEN
        EXECUTE 'ALTER INDEX idx_matches_scheduled_at_v3 RENAME TO idx_matches_startTime_v3';
    END IF;
END;
$$;

-- Recreate partial indexes that reference renamed columns
DROP INDEX IF EXISTS idx_matches_upcoming_v3;
CREATE INDEX IF NOT EXISTS idx_matches_upcoming_v3
ON "Match" ("startTime")
WHERE status = 'scheduled';

DROP INDEX IF EXISTS idx_matches_live_v3;
CREATE INDEX IF NOT EXISTS idx_matches_live_v3
ON "Match" ("startTime")
WHERE status = 'in_progress';

DROP INDEX IF EXISTS idx_matches_recent_v3;
CREATE INDEX IF NOT EXISTS idx_matches_recent_v3
ON "Match" ("startTime" DESC)
WHERE status = 'completed';

-- Refresh trigger function to use new column names
CREATE OR REPLACE FUNCTION set_match_sport()
RETURNS TRIGGER AS $$
BEGIN
    SELECT sport INTO NEW."sport"
    FROM "Competition"
    WHERE id = NEW."competitionId";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
