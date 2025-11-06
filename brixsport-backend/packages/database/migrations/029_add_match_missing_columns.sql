-- Add missing columns to Match table
-- This migration adds the missing columns to match the Prisma schema

BEGIN;

-- Add the deleted column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Add the deletedAt column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;

-- Add the venueId column to the Match table (without foreign key constraint for now)
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "venueId" UUID;

-- Add the endTime column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP WITH TIME ZONE;

-- Add the currentMinute column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "currentMinute" INTEGER;

-- Add the period column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS period VARCHAR(50);

-- Add the notes column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add the metadata column to the Match table
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_match_deleted ON "Match"(deleted);
CREATE INDEX IF NOT EXISTS idx_match_venueId ON "Match"("venueId");

-- Add comments for documentation
COMMENT ON COLUMN "Match".deleted IS 'Soft delete flag';
COMMENT ON COLUMN "Match"."deletedAt" IS 'Timestamp when the match was soft deleted';
COMMENT ON COLUMN "Match"."venueId" IS 'Reference to the venue';
COMMENT ON COLUMN "Match"."endTime" IS 'Match end time';
COMMENT ON COLUMN "Match"."currentMinute" IS 'Current minute of the match (for football)';
COMMENT ON COLUMN "Match".period IS 'Current period of the match';
COMMENT ON COLUMN "Match".notes IS 'Additional notes about the match';
COMMENT ON COLUMN "Match".metadata IS 'Additional metadata about the match';

COMMIT;