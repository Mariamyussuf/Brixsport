-- Add gender column to Player table
-- This migration adds the missing gender column to sync with the Prisma schema

-- Add the gender column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Add a comment for documentation
COMMENT ON COLUMN "Player".gender IS 'Player gender (male, female, other)';

-- Create an index for the gender column if needed for search
-- CREATE INDEX IF NOT EXISTS idx_player_gender ON "Player"(gender);