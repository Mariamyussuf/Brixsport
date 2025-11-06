-- Add importance column to Match table
-- This migration adds the importance column to match the Prisma schema

BEGIN;

-- Add the importance column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS importance VARCHAR(50) DEFAULT 'regular';

-- Create an index for the importance column for better query performance
CREATE INDEX IF NOT EXISTS idx_match_importance ON "Match"(importance);

-- Add a check constraint to ensure only valid importance values
ALTER TABLE "Match" ADD CONSTRAINT check_match_importance 
  CHECK (importance IN ('regular', 'playoff', 'final', 'friendly'));

-- Add comment for documentation
COMMENT ON COLUMN "Match".importance IS 'Match importance level: regular, playoff, final, or friendly';

COMMIT;