-- Add description column to Team table
-- This migration adds the missing description column to sync with the Prisma schema

-- Add the description column to the Team table
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN "Team".description IS 'Team description';

-- Update any existing teams to have an empty description if null
UPDATE "Team" SET description = '' WHERE description IS NULL;

-- Create an index for the description column if needed for search
-- CREATE INDEX IF NOT EXISTS idx_team_description ON "Team"(description);