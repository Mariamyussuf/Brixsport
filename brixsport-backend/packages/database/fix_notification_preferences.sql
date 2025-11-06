-- Fix for notification_preferences table structure

-- Add missing columns to the existing notification_preferences table
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(100) NOT NULL DEFAULT 'general';

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT 'in_app';

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) DEFAULT 'immediate';

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME;

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME;

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Change id column type if needed (from integer to UUID)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_preferences' 
    AND column_name = 'id' 
    AND data_type = 'integer'
  ) THEN
    -- This is a more complex change that would require recreating the table
    -- For now, we'll just note that the id column may need manual attention
    RAISE NOTICE 'The id column is still integer type. Manual intervention may be needed for full compatibility.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking id column type: %', SQLERRM;
END $$;

-- Remove old columns that are no longer needed
ALTER TABLE notification_preferences 
DROP COLUMN IF EXISTS delivery_methods;

ALTER TABLE notification_preferences 
DROP COLUMN IF EXISTS categories;

ALTER TABLE notification_preferences 
DROP COLUMN IF EXISTS email_frequency;

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_channel ON notification_preferences(channel);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_unique ON notification_preferences(user_id, notification_type, channel);

-- Update the create_notification function to work with the new structure
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, VARCHAR[], VARCHAR, VARCHAR, VARCHAR, UUID, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_channels VARCHAR[] DEFAULT ARRAY['in_app'],
    p_priority VARCHAR DEFAULT 'normal',
    p_category VARCHAR DEFAULT NULL,
    p_source_type VARCHAR DEFAULT NULL,
    p_source_id UUID DEFAULT NULL,
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    user_prefs RECORD;
    should_send BOOLEAN := TRUE;
BEGIN
    -- Check user preferences (with proper column reference)
    SELECT INTO user_prefs
        enabled, frequency, quiet_hours_start, quiet_hours_end
    FROM notification_preferences
    WHERE user_id = p_user_id 
    AND notification_type = p_type 
    AND channel = ANY(p_channels)
    LIMIT 1;
    
    -- Check if notifications are enabled for this type
    IF FOUND AND NOT user_prefs.enabled THEN
        should_send := FALSE;
    END IF;
    
    -- Check quiet hours (simplified - assumes user timezone is handled elsewhere)
    IF FOUND AND user_prefs.quiet_hours_start IS NOT NULL AND user_prefs.quiet_hours_end IS NOT NULL THEN
        IF EXTRACT(HOUR FROM p_scheduled_for) BETWEEN 
           EXTRACT(HOUR FROM user_prefs.quiet_hours_start) AND 
           EXTRACT(HOUR FROM user_prefs.quiet_hours_end) THEN
            -- Reschedule for after quiet hours
            p_scheduled_for := p_scheduled_for + INTERVAL '8 hours';
        END IF;
    END IF;
    
    -- Create the notification
    INSERT INTO notifications (
        user_id, type, title, message, data, channels, priority, category,
        source_type, source_id, scheduled_for, status
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_data, p_channels, p_priority, p_category,
        p_source_type, p_source_id, p_scheduled_for, 
        CASE WHEN should_send THEN 'pending' ELSE 'suppressed' END
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;