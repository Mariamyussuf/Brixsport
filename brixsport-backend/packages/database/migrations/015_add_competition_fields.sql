-- Migration: Add missing Competition table fields
-- Description: adds country, sport, and logo_url columns to Competition table

BEGIN;

-- Add country column if it does not already exist
ALTER TABLE "Competition"
  ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Add sport column if it does not already exist
ALTER TABLE "Competition"
  ADD COLUMN IF NOT EXISTS sport VARCHAR(100);

-- Add logo_url column if it does not already exist
ALTER TABLE "Competition"
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_competition_country ON "Competition"(country);
CREATE INDEX IF NOT EXISTS idx_competition_sport ON "Competition"(sport);

-- Update existing competitions with default values for Nigeria (as requested by user)
UPDATE "Competition"
SET
  country = 'Nigeria',
  sport = COALESCE(sport, 'football')
WHERE country IS NULL OR sport IS NULL;

COMMIT;
