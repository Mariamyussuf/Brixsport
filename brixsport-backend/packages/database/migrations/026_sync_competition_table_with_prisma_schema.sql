-- Sync Competition table with Prisma schema
-- This migration renames the season_id column to seasonId to match the Prisma schema

BEGIN;

-- Rename season_id column to seasonId to match Prisma schema
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Competition'
          AND column_name = 'season_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Competition'
          AND column_name = 'seasonId'
    ) THEN
        EXECUTE 'ALTER TABLE "Competition" RENAME COLUMN season_id TO "seasonId"';
    END IF;
END;
$$;

-- Update the index name to match the new column name
ALTER INDEX IF EXISTS idx_competition_season_id RENAME TO idx_competition_seasonId;

-- Update any foreign key constraints if they exist
-- Note: The constraint name might vary based on PostgreSQL's naming convention
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'Competition'
      AND kcu.column_name = 'seasonId'
      AND tc.constraint_name LIKE '%season_id%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "Competition" RENAME CONSTRAINT ' || quote_ident(constraint_name) || ' TO "Competition_seasonId_fkey"';
    END IF;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN "Competition"."seasonId" IS 'Reference to the season this competition belongs to';

COMMIT;