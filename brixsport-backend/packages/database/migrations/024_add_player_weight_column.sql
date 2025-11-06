-- Add weight column to Player table
-- This migration adds the missing weight column to sync with the Prisma schema

-- Add the weight column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Add a comment for documentation
COMMENT ON COLUMN "Player".weight IS 'Player weight in kg';

-- Create an index for the weight column for better query performance
CREATE INDEX IF NOT EXISTS idx_player_weight ON "Player"(weight);