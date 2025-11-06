-- Add height column to Player table
-- This migration adds the missing height column to sync with the Prisma schema

-- Add the height column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS height INTEGER;

-- Add a comment for documentation
COMMENT ON COLUMN "Player".height IS 'Player height in cm';

-- Create an index for the height column for better query performance
CREATE INDEX IF NOT EXISTS idx_player_height ON "Player"(height);