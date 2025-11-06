-- Add sport column to Player table
-- This migration adds the missing sport column to sync with the Prisma schema

-- Add the sport column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS sport VARCHAR(50);

-- Add a comment for documentation
COMMENT ON COLUMN "Player".sport IS 'Player sport (football, basketball, track_events, etc.)';

-- Create an index for the sport column for better query performance
CREATE INDEX IF NOT EXISTS idx_player_sport ON "Player"(sport);