-- Add archived column to Match table
-- This migration adds the archived column to match the Prisma schema

BEGIN;

-- Add the archived column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add the archivedAt column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP WITH TIME ZONE;

-- Create an index for the archived column for better query performance
CREATE INDEX IF NOT EXISTS idx_match_archived ON "Match"(archived);

-- Add comment for documentation
COMMENT ON COLUMN "Match".archived IS 'Indicates if the match has been archived';
COMMENT ON COLUMN "Match"."archivedAt" IS 'Timestamp when the match was archived';

COMMIT;