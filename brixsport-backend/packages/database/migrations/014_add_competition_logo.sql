-- Migration: Add competition logo support
-- Description: adds logo_url column to Competition table and seeds known competition logos

BEGIN;

-- Add logo_url column if it does not already exist
ALTER TABLE "Competition"
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMIT;
