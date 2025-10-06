-- Migration: Add Sport Filtering Support
-- This migration adds sport classification to enable proper sport-based filtering

-- Add sport field to Competition table
ALTER TABLE "Competition" ADD COLUMN IF NOT EXISTS sport VARCHAR(50) NOT NULL DEFAULT 'football';

-- Create index for sport filtering
CREATE INDEX IF NOT EXISTS idx_competition_sport ON "Competition"(sport);

-- Update existing competitions with sport types (you can modify these based on your data)
-- This is a sample update - adjust based on your actual competition data
UPDATE "Competition" SET sport = 'football' WHERE type LIKE '%football%' OR type LIKE '%soccer%' OR name ILIKE '%football%';
UPDATE "Competition" SET sport = 'basketball' WHERE type LIKE '%basketball%' OR name ILIKE '%basketball%';
UPDATE "Competition" SET sport = 'track' WHERE type LIKE '%track%' OR type LIKE '%athletics%' OR name ILIKE '%track%' OR name ILIKE '%athletics%';

-- Add sport field to Match table for direct filtering (optional but recommended)
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS sport VARCHAR(50);

-- Create index for match sport filtering
CREATE INDEX IF NOT EXISTS idx_match_sport ON "Match"(sport);

-- Update Match sport field based on Competition sport
DO $$
DECLARE
    match_competition_col TEXT;
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) THEN 'competition_id' ELSE '"competitionId"' END
    INTO match_competition_col;

    EXECUTE format(
        'UPDATE "Match" SET sport = c.sport FROM "Competition" c WHERE "Match".%s = c.id AND "Match".sport IS NULL',
        match_competition_col
    );
END;
$$;

-- Create a trigger to automatically set match sport when inserting new matches
CREATE OR REPLACE FUNCTION set_match_sport()
RETURNS TRIGGER AS $$
BEGIN
    -- Set the sport field based on the competition
    SELECT sport INTO NEW.sport 
    FROM "Competition" 
    WHERE id = NEW.competition_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new matches
DROP TRIGGER IF EXISTS trigger_set_match_sport ON "Match";
CREATE TRIGGER trigger_set_match_sport
    BEFORE INSERT ON "Match"
    FOR EACH ROW
    EXECUTE FUNCTION set_match_sport();

-- Create trigger for match updates when competition changes
DROP TRIGGER IF EXISTS trigger_update_match_sport ON "Match";
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) THEN
        EXECUTE 'CREATE TRIGGER trigger_update_match_sport BEFORE UPDATE OF competition_id ON "Match" FOR EACH ROW EXECUTE FUNCTION set_match_sport()';
    ELSE
        EXECUTE 'CREATE TRIGGER trigger_update_match_sport BEFORE UPDATE ON "Match" FOR EACH ROW WHEN (OLD."competitionId" IS DISTINCT FROM NEW."competitionId") EXECUTE FUNCTION set_match_sport()';
    END IF;
END;
$$;
