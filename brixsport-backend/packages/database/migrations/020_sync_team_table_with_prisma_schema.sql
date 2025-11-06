-- Sync Team table with Prisma schema
-- This migration adds all missing columns to sync with the Prisma schema

-- Add missing columns to the Team table
ALTER TABLE "Team" 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_media JSONB,
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_draws INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_percentage DECIMAL(5,2) DEFAULT 0;

-- Rename existing columns to match Prisma schema
-- Note: We'll keep the existing columns for backward compatibility
-- But we'll add the new ones that match the Prisma schema

-- Add comments for documentation
COMMENT ON COLUMN "Team".description IS 'Team description';
COMMENT ON COLUMN "Team".logo IS 'Team logo URL';
COMMENT ON COLUMN "Team".color IS 'Team primary color';
COMMENT ON COLUMN "Team".founded_year IS 'Year the team was founded';
COMMENT ON COLUMN "Team".website IS 'Team website URL';
COMMENT ON COLUMN "Team".social_media IS 'Team social media links';
COMMENT ON COLUMN "Team".total_wins IS 'Total wins';
COMMENT ON COLUMN "Team".total_losses IS 'Total losses';
COMMENT ON COLUMN "Team".total_draws IS 'Total draws';
COMMENT ON COLUMN "Team".win_percentage IS 'Win percentage';

-- Update any existing teams to have default values for new columns
UPDATE "Team" SET 
  total_wins = COALESCE(total_wins, 0),
  total_losses = COALESCE(total_losses, 0),
  total_draws = COALESCE(total_draws, 0),
  win_percentage = COALESCE(win_percentage, 0);

-- Create indexes for the new columns if needed
-- CREATE INDEX IF NOT EXISTS idx_team_founded_year ON "Team"(founded_year);
-- CREATE INDEX IF NOT EXISTS idx_team_color ON "Team"(color);