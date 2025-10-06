-- Notifications and Messaging Migration
-- This migration adds comprehensive notification and messaging systems

-- =============================================================================
-- NOTIFICATION SYSTEM
-- =============================================================================

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- 'email', 'push', 'sms', 'in_app'
    enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'never'
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_channel ON notification_preferences(channel);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_unique ON notification_preferences(user_id, notification_type, channel);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    channels VARCHAR(50)[] DEFAULT ARRAY['in_app'], -- Channels to send through
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    category VARCHAR(100), -- 'match', 'team', 'player', 'system', 'social'
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    source_type VARCHAR(100), -- 'match_event', 'team_update', 'system_alert'
    source_id UUID,
    group_key VARCHAR(255), -- For grouping related notifications
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_notifications_group_key ON notifications(group_key);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(active);

-- =============================================================================
-- MESSAGING SYSTEM
-- =============================================================================

-- Conversations (for direct messages, group chats, etc.)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'channel'
    name VARCHAR(255),
    description TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_settings JSONB DEFAULT '{}',
    muted BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_role ON conversation_participants(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_participants_unique ON conversation_participants(conversation_id, user_id) WHERE left_at IS NULL;

-- Messages (enhanced from chat_messages)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- For replies/threads
    
    -- Message content
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'file', 'system', 'poll'
    formatted_content JSONB, -- Rich text formatting, mentions, etc.
    
    -- Attachments
    attachments JSONB DEFAULT '[]', -- Array of attachment objects
    
    -- Message metadata
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    pinned BOOLEAN DEFAULT FALSE,
    pinned_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    pinned_at TIMESTAMP WITH TIME ZONE,
    
    -- Reactions and interactions
    reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}
    mention_user_ids UUID[],
    
    -- Moderation
    flagged BOOLEAN DEFAULT FALSE,
    flagged_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    flagged_at TIMESTAMP WITH TIME ZONE,
    flagged_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES "User"(id) ON DELETE SET NULL
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_content_type ON messages(content_type);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(pinned);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(flagged);
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING GIN(mention_user_ids);

-- Message Read Status
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message_read_status
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_read_status_unique ON message_read_status(message_id, user_id);

-- =============================================================================
-- BROADCAST SYSTEM
-- =============================================================================

-- Broadcast Messages (for announcements, system messages)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    
    -- Targeting
    target_type VARCHAR(50) NOT NULL, -- 'all_users', 'user_segment', 'specific_users'
    target_criteria JSONB, -- Criteria for user_segment targeting
    target_user_ids UUID[], -- For specific_users targeting
    
    -- Scheduling and delivery
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal',
    channels VARCHAR(50)[] DEFAULT ARRAY['in_app'],
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
    sent_at TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for broadcast_messages
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sender_id ON broadcast_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_target_type ON broadcast_messages(target_type);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_status ON broadcast_messages(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_scheduled_for ON broadcast_messages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_created_at ON broadcast_messages(created_at);

-- Broadcast Recipients (tracking individual delivery)
CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for broadcast_recipients
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_user_id ON broadcast_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_status ON broadcast_recipients(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_broadcast_recipients_unique ON broadcast_recipients(broadcast_id, user_id);

-- =============================================================================
-- NOTIFICATION FUNCTIONS
-- =============================================================================

-- Function to create a notification
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
    -- Check user preferences
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

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
    p_user_id UUID,
    p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF p_notification_ids IS NOT NULL THEN
        -- Mark specific notifications as read
        UPDATE notifications 
        SET read_at = NOW(), updated_at = NOW()
        WHERE user_id = p_user_id 
        AND id = ANY(p_notification_ids)
        AND read_at IS NULL;
    ELSE
        -- Mark all unread notifications as read
        UPDATE notifications 
        SET read_at = NOW(), updated_at = NOW()
        WHERE user_id = p_user_id 
        AND read_at IS NULL;
    END IF;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to send broadcast message
CREATE OR REPLACE FUNCTION send_broadcast_message(p_broadcast_id UUID)
RETURNS INTEGER AS $$
DECLARE
    broadcast_rec RECORD;
    target_users UUID[];
    user_id UUID;
    recipients_count INTEGER := 0;
BEGIN
    -- Get broadcast message details
    SELECT * INTO broadcast_rec FROM broadcast_messages WHERE id = p_broadcast_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Broadcast message not found';
    END IF;
    
    -- Determine target users based on target_type
    CASE broadcast_rec.target_type
        WHEN 'all_users' THEN
            SELECT array_agg(id) INTO target_users 
            FROM "User" 
            WHERE deleted = FALSE AND suspended = FALSE;
            
        WHEN 'specific_users' THEN
            target_users := broadcast_rec.target_user_ids;
            
        WHEN 'user_segment' THEN
            -- This would need to be implemented based on specific segmentation criteria
            -- For now, default to all users
            SELECT array_agg(id) INTO target_users 
            FROM "User" 
            WHERE deleted = FALSE AND suspended = FALSE;
    END CASE;
    
    -- Create broadcast recipients
    FOREACH user_id IN ARRAY target_users
    LOOP
        INSERT INTO broadcast_recipients (broadcast_id, user_id)
        VALUES (p_broadcast_id, user_id)
        ON CONFLICT (broadcast_id, user_id) DO NOTHING;
        
        -- Create individual notification
        PERFORM create_notification(
            user_id,
            'broadcast',
            broadcast_rec.title,
            broadcast_rec.content,
            jsonb_build_object('broadcast_id', p_broadcast_id),
            broadcast_rec.channels,
            broadcast_rec.priority,
            'system',
            'broadcast_messages',
            p_broadcast_id,
            broadcast_rec.scheduled_for
        );
        
        recipients_count := recipients_count + 1;
    END LOOP;
    
    -- Update broadcast message status
    UPDATE broadcast_messages 
    SET status = 'sent', 
        sent_at = NOW(), 
        recipients_count = recipients_count,
        updated_at = NOW()
    WHERE id = p_broadcast_id;
    
    RETURN recipients_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MESSAGING FUNCTIONS
-- =============================================================================

-- Function to create a conversation
CREATE OR REPLACE FUNCTION create_conversation(
    p_creator_id UUID,
    p_type VARCHAR DEFAULT 'direct',
    p_name VARCHAR DEFAULT NULL,
    p_participant_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    participant_id UUID;
BEGIN
    -- Create the conversation
    INSERT INTO conversations (type, name, created_by)
    VALUES (p_type, p_name, p_creator_id)
    RETURNING id INTO conversation_id;
    
    -- Add creator as owner
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES (conversation_id, p_creator_id, 'owner');
    
    -- Add other participants
    FOREACH participant_id IN ARRAY p_participant_ids
    LOOP
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES (conversation_id, participant_id, 'member')
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_user_id UUID,
    p_content TEXT,
    p_content_type VARCHAR DEFAULT 'text',
    p_parent_message_id UUID DEFAULT NULL,
    p_attachments JSONB DEFAULT '[]',
    p_mention_user_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
    participant_id UUID;
BEGIN
    -- Verify user is a participant in the conversation
    IF NOT EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = p_conversation_id 
        AND user_id = p_user_id 
        AND left_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User is not a participant in this conversation';
    END IF;
    
    -- Create the message
    INSERT INTO messages (
        conversation_id, user_id, parent_message_id, content, content_type,
        attachments, mention_user_ids
    ) VALUES (
        p_conversation_id, p_user_id, p_parent_message_id, p_content, p_content_type,
        p_attachments, p_mention_user_ids
    ) RETURNING id INTO message_id;
    
    -- Update conversation timestamp
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = p_conversation_id;
    
    -- Create notifications for mentioned users
    FOREACH participant_id IN ARRAY p_mention_user_ids
    LOOP
        PERFORM create_notification(
            participant_id,
            'message_mention',
            'You were mentioned in a message',
            p_content,
            jsonb_build_object(
                'conversation_id', p_conversation_id,
                'message_id', message_id,
                'sender_id', p_user_id
            ),
            ARRAY['in_app', 'push'],
            'normal',
            'social'
        );
    END LOOP;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS AND CONSTRAINTS
-- =============================================================================

-- Trigger to update conversation updated_at when messages are added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Add constraints
ALTER TABLE notification_preferences ADD CONSTRAINT check_notification_channel 
CHECK (channel IN ('email', 'push', 'sms', 'in_app'));

ALTER TABLE notification_preferences ADD CONSTRAINT check_notification_frequency 
CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never'));

ALTER TABLE notifications ADD CONSTRAINT check_notification_priority 
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE notifications ADD CONSTRAINT check_notification_status 
CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'suppressed'));

ALTER TABLE conversations ADD CONSTRAINT check_conversation_type 
CHECK (type IN ('direct', 'group', 'channel'));

ALTER TABLE conversation_participants ADD CONSTRAINT check_participant_role 
CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

ALTER TABLE messages ADD CONSTRAINT check_message_content_type 
CHECK (content_type IN ('text', 'image', 'file', 'system', 'poll', 'rich_text'));

ALTER TABLE broadcast_messages ADD CONSTRAINT check_broadcast_target_type 
CHECK (target_type IN ('all_users', 'user_segment', 'specific_users'));

ALTER TABLE broadcast_messages ADD CONSTRAINT check_broadcast_status 
CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled'));

-- Add table comments
COMMENT ON TABLE notification_preferences IS 'User preferences for different types of notifications';
COMMENT ON TABLE notifications IS 'Individual notifications sent to users';
COMMENT ON TABLE notification_templates IS 'Templates for generating notifications';
COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON TABLE message_read_status IS 'Tracking read status of messages';
COMMENT ON TABLE broadcast_messages IS 'System-wide broadcast messages and announcements';
COMMENT ON TABLE broadcast_recipients IS 'Individual delivery tracking for broadcast messages';

-- Insert default notification templates
INSERT INTO notification_templates (name, type, channel, subject_template, body_template, variables) VALUES
('match_start', 'match_event', 'push', 'Match Starting Soon!', 'The match between {{home_team}} and {{away_team}} is starting in {{minutes}} minutes.', '["home_team", "away_team", "minutes"]'),
('goal_scored', 'match_event', 'push', 'GOAL!', '{{player}} scored for {{team}}! Current score: {{home_team}} {{home_score}} - {{away_score}} {{away_team}}', '["player", "team", "home_team", "away_team", "home_score", "away_score"]'),
('match_finished', 'match_event', 'push', 'Match Finished', 'Final score: {{home_team}} {{home_score}} - {{away_score}} {{away_team}}', '["home_team", "away_team", "home_score", "away_score"]'),
('team_news', 'team_update', 'in_app', 'Team Update', '{{team}} has posted an update: {{content}}', '["team", "content"]'),
('player_transfer', 'player_update', 'in_app', 'Player Transfer', '{{player}} has joined {{new_team}} from {{old_team}}', '["player", "new_team", "old_team"]')
ON CONFLICT (name) DO NOTHING;
