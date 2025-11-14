-- Messaging System Enhancements
-- Adds real-time features, typing indicators, delivery status, and message reactions tables

-- =============================================================================
-- MESSAGE DELIVERY STATUS TRACKING
-- =============================================================================

-- Message Delivery Status Table (separate from read status)
CREATE TABLE IF NOT EXISTS message_delivery_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message_delivery_status
CREATE INDEX IF NOT EXISTS idx_message_delivery_status_message_id ON message_delivery_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_status_user_id ON message_delivery_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_delivery_status_status ON message_delivery_status(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_delivery_status_unique ON message_delivery_status(message_id, user_id);

-- =============================================================================
-- TYPING INDICATORS
-- =============================================================================

-- Typing Indicators Table (ephemeral data, can be stored in Redis in production)
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 seconds'
);

-- Create indexes for typing_indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at ON typing_indicators(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_typing_indicators_unique ON typing_indicators(conversation_id, user_id);

-- =============================================================================
-- MESSAGE REACTIONS (Enhanced)
-- =============================================================================

-- Message Reactions Table (normalized from JSONB to proper table)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message_reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_emoji ON message_reactions(emoji);
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reactions_unique ON message_reactions(message_id, user_id, emoji);

-- =============================================================================
-- ANNOUNCEMENTS (Enhanced)
-- =============================================================================

-- Announcements Table (separate from broadcast_messages for better organization)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'html', 'markdown'
    priority VARCHAR(50) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent', 'critical'
    category VARCHAR(100), -- 'system', 'maintenance', 'feature', 'event'
    tags VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],
    
    -- Targeting
    target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'users', 'loggers', 'admins'
    target_user_ids UUID[], -- For specific user targeting
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'expired', 'archived'
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Author
    created_by UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled_at ON announcements(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_tags ON announcements USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned) WHERE is_pinned = TRUE;

-- =============================================================================
-- CONVERSATION METADATA ENHANCEMENTS
-- =============================================================================

-- Add last_message_at column to conversations if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add last_message_id column to conversations if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_message_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for last_message_at
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- =============================================================================
-- FUNCTIONS FOR REAL-TIME FEATURES
-- =============================================================================

-- Function to update typing indicator
CREATE OR REPLACE FUNCTION update_typing_indicator(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    indicator_id UUID;
BEGIN
    -- Insert or update typing indicator
    INSERT INTO typing_indicators (conversation_id, user_id, started_at, expires_at)
    VALUES (
        p_conversation_id, 
        p_user_id, 
        NOW(), 
        NOW() + INTERVAL '10 seconds'
    )
    ON CONFLICT (conversation_id, user_id) 
    DO UPDATE SET 
        started_at = NOW(),
        expires_at = NOW() + INTERVAL '10 seconds'
    RETURNING id INTO indicator_id;
    
    RETURN indicator_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM typing_indicators
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get active typing users in a conversation
CREATE OR REPLACE FUNCTION get_typing_users(p_conversation_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR,
    started_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- First cleanup expired indicators
    PERFORM cleanup_expired_typing_indicators();
    
    -- Return active typing users
    RETURN QUERY
    SELECT 
        ti.user_id,
        u.name as user_name,
        ti.started_at
    FROM typing_indicators ti
    JOIN "User" u ON u.id = ti.user_id
    WHERE ti.conversation_id = p_conversation_id
    AND ti.expires_at > NOW()
    ORDER BY ti.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to track message delivery
CREATE OR REPLACE FUNCTION track_message_delivery(
    p_message_id UUID,
    p_user_id UUID,
    p_status VARCHAR DEFAULT 'sent'
)
RETURNS UUID AS $$
DECLARE
    delivery_id UUID;
BEGIN
    -- Insert or update delivery status
    INSERT INTO message_delivery_status (message_id, user_id, status, delivered_at)
    VALUES (
        p_message_id,
        p_user_id,
        p_status,
        CASE WHEN p_status = 'delivered' THEN NOW() ELSE NULL END
    )
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET
        status = p_status,
        delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE message_delivery_status.delivered_at END,
        updated_at = NOW()
    RETURNING id INTO delivery_id;
    
    RETURN delivery_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add message reaction
CREATE OR REPLACE FUNCTION add_message_reaction(
    p_message_id UUID,
    p_user_id UUID,
    p_emoji VARCHAR
)
RETURNS UUID AS $$
DECLARE
    reaction_id UUID;
BEGIN
    -- Insert reaction (will fail on conflict due to unique constraint)
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES (p_message_id, p_user_id, p_emoji)
    ON CONFLICT (message_id, user_id, emoji) DO NOTHING
    RETURNING id INTO reaction_id;
    
    RETURN reaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to remove message reaction
CREATE OR REPLACE FUNCTION remove_message_reaction(
    p_message_id UUID,
    p_user_id UUID,
    p_emoji VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM message_reactions
    WHERE message_id = p_message_id
    AND user_id = p_user_id
    AND emoji = p_emoji;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation last message
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR REAL-TIME FEATURES
-- =============================================================================

-- Enable RLS on relevant tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.left_at IS NULL
    )
);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.left_at IS NULL
    )
);

-- Create RLS policies for typing indicators
CREATE POLICY "Users can view typing indicators in their conversations"
ON typing_indicators FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = typing_indicators.conversation_id
        AND conversation_participants.user_id = auth.uid()
        AND conversation_participants.left_at IS NULL
    )
);

CREATE POLICY "Users can insert their own typing indicators"
ON typing_indicators FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing indicators"
ON typing_indicators FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicators"
ON typing_indicators FOR DELETE
USING (auth.uid() = user_id);

-- =============================================================================
-- HELPER VIEWS
-- =============================================================================

-- View for conversation summaries with unread counts
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
    c.id,
    c.type,
    c.name,
    c.description,
    c.avatar_url,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.archived,
    cp.user_id,
    cp.role,
    cp.last_read_at,
    cp.muted,
    -- Count unread messages
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.deleted = FALSE
        AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
        AND m.user_id != cp.user_id
    ) as unread_count
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id
WHERE cp.left_at IS NULL;

-- Add table comments
COMMENT ON TABLE message_delivery_status IS 'Tracks delivery status of messages to individual recipients';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for conversations';
COMMENT ON TABLE message_reactions IS 'User reactions to messages';
COMMENT ON TABLE announcements IS 'System announcements and important messages';

-- Insert sample announcement for testing
INSERT INTO announcements (
    title, 
    content, 
    priority, 
    category, 
    tags, 
    status, 
    created_by, 
    scheduled_at
)
SELECT 
    'Welcome to BrixSport Messaging',
    'You can now send messages and receive real-time updates!',
    'normal',
    'feature',
    ARRAY['messaging', 'feature-launch'],
    'published',
    (SELECT id FROM "User" WHERE role IN ('admin', 'super-admin') LIMIT 1),
    NOW()
WHERE EXISTS (SELECT 1 FROM "User" WHERE role IN ('admin', 'super-admin') LIMIT 1)
ON CONFLICT DO NOTHING;
