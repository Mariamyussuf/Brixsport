-- Migration to allow jersey numbers 0 and 00 (represented as 0 in database) for basketball players
-- This addresses the constraint issue where jersey_number > 0 was required

-- Drop the existing constraint
ALTER TABLE "Player" DROP CONSTRAINT IF EXISTS check_player_jersey_number;

-- Add a new constraint that allows 0 and numbers 1-99
-- For basketball, 0 represents both 0 and 00 jersey numbers
ALTER TABLE "Player" ADD CONSTRAINT check_player_jersey_number CHECK (
    jersey_number >= 0 AND jersey_number <= 99 AND 
    (jersey_number = 0 OR jersey_number >= 1)
);