-- Add missing columns to Player table
-- This migration adds the missing columns to sync with the Prisma schema

-- Add the career_stats column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS career_stats JSONB;

-- Add the salary column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS salary DECIMAL(15,2);

-- Add the contract_start column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS contract_start DATE;

-- Add the contract_end column to the Player table
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS contract_end DATE;

-- Add comments for documentation
COMMENT ON COLUMN "Player".career_stats IS 'Player career statistics';
COMMENT ON COLUMN "Player".salary IS 'Player salary';
COMMENT ON COLUMN "Player".contract_start IS 'Player contract start date';
COMMENT ON COLUMN "Player".contract_end IS 'Player contract end date';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_player_career_stats ON "Player"(career_stats);
CREATE INDEX IF NOT EXISTS idx_player_salary ON "Player"(salary);
CREATE INDEX IF NOT EXISTS idx_player_contract_start ON "Player"(contract_start);
CREATE INDEX IF NOT EXISTS idx_player_contract_end ON "Player"(contract_end);