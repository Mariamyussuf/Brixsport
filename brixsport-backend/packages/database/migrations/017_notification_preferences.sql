-- Migration: Notification Preferences Table

-- Drop existing table if it exists
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS notification_preferences_set_updated_at();

-- Create notification_preferences table
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delivery_methods JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": false, "inApp": true}'::jsonb,
    categories JSONB NOT NULL DEFAULT '{"matchUpdates": true, "teamNews": true, "competitionNews": true, "marketing": false, "systemAlerts": true}'::jsonb,
    email_frequency VARCHAR(20) DEFAULT 'INSTANT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notification_preferences_select_own') THEN
        DROP POLICY notification_preferences_select_own ON notification_preferences;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notification_preferences_update_own') THEN
        DROP POLICY notification_preferences_update_own ON notification_preferences;
    END IF;
END
$$;

-- Policy: users can view their own preferences
CREATE POLICY notification_preferences_select_own
    ON notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: users can update their own preferences
CREATE POLICY notification_preferences_update_own
    ON notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create or replace function for updated_at trigger
CREATE OR REPLACE FUNCTION notification_preferences_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION notification_preferences_set_updated_at();
