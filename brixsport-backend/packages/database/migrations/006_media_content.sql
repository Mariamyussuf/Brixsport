-- Media and Content Migration
-- This migration adds comprehensive media management and content systems

-- =============================================================================
-- MEDIA MANAGEMENT
-- =============================================================================

-- Media Files
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    
    -- Media metadata
    media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document'
    dimensions JSONB, -- {width: number, height: number} for images/videos
    duration INTEGER, -- Duration in seconds for audio/video
    metadata JSONB, -- EXIF data, video codec info, etc.
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Variants (thumbnails, different resolutions, etc.)
    variants JSONB DEFAULT '[]', -- Array of variant objects
    
    -- Access control
    visibility VARCHAR(50) DEFAULT 'private', -- 'public', 'private', 'team_only'
    access_permissions JSONB DEFAULT '{}',
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Content moderation
    moderation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'
    moderation_flags JSONB DEFAULT '[]',
    moderated_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for media_files
CREATE INDEX IF NOT EXISTS idx_media_files_uploader_id ON media_files(uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_files_file_hash ON media_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_media_files_processing_status ON media_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_media_files_visibility ON media_files(visibility);
CREATE INDEX IF NOT EXISTS idx_media_files_moderation_status ON media_files(moderation_status);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);
CREATE INDEX IF NOT EXISTS idx_media_files_deleted ON media_files(deleted);

-- Media Collections (albums, galleries, etc.)
CREATE TABLE IF NOT EXISTS media_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'album', -- 'album', 'gallery', 'playlist'
    cover_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    
    -- Settings
    visibility VARCHAR(50) DEFAULT 'private',
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    media_count INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for media_collections
CREATE INDEX IF NOT EXISTS idx_media_collections_owner_id ON media_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_media_collections_type ON media_collections(type);
CREATE INDEX IF NOT EXISTS idx_media_collections_visibility ON media_collections(visibility);
CREATE INDEX IF NOT EXISTS idx_media_collections_deleted ON media_collections(deleted);

-- Media Collection Items
CREATE TABLE IF NOT EXISTS media_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES media_collections(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    caption TEXT,
    metadata JSONB DEFAULT '{}',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for media_collection_items
CREATE INDEX IF NOT EXISTS idx_media_collection_items_collection_id ON media_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_media_collection_items_media_file_id ON media_collection_items(media_file_id);
CREATE INDEX IF NOT EXISTS idx_media_collection_items_sort_order ON media_collection_items(sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_collection_items_unique ON media_collection_items(collection_id, media_file_id);

-- =============================================================================
-- CONTENT MANAGEMENT SYSTEM
-- =============================================================================

-- Content Categories
CREATE TABLE IF NOT EXISTS content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content_categories
CREATE INDEX IF NOT EXISTS idx_content_categories_parent_id ON content_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_slug ON content_categories(slug);
CREATE INDEX IF NOT EXISTS idx_content_categories_active ON content_categories(active);
CREATE INDEX IF NOT EXISTS idx_content_categories_sort_order ON content_categories(sort_order);

-- Content Tags
CREATE TABLE IF NOT EXISTS content_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content_tags
CREATE INDEX IF NOT EXISTS idx_content_tags_name ON content_tags(name);
CREATE INDEX IF NOT EXISTS idx_content_tags_slug ON content_tags(slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_usage_count ON content_tags(usage_count);

-- Enhanced Articles (extending the basic Article table)
CREATE TABLE IF NOT EXISTS article_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES "Article"(id) ON DELETE CASCADE,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    canonical_url TEXT,
    
    -- Social media
    og_title VARCHAR(255),
    og_description TEXT,
    og_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    
    -- Content structure
    reading_time INTEGER, -- Estimated reading time in minutes
    word_count INTEGER,
    excerpt_auto BOOLEAN DEFAULT TRUE,
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Analytics
    page_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2),
    avg_time_on_page INTEGER, -- in seconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for article_metadata
CREATE INDEX IF NOT EXISTS idx_article_metadata_article_id ON article_metadata(article_id);
CREATE INDEX IF NOT EXISTS idx_article_metadata_reading_time ON article_metadata(reading_time);
CREATE INDEX IF NOT EXISTS idx_article_metadata_word_count ON article_metadata(word_count);
CREATE INDEX IF NOT EXISTS idx_article_metadata_page_views ON article_metadata(page_views);

-- Article Categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS article_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES "Article"(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES content_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for article_categories
CREATE INDEX IF NOT EXISTS idx_article_categories_article_id ON article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_category_id ON article_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_primary ON article_categories(is_primary);
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_categories_unique ON article_categories(article_id, category_id);

-- Article Tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES "Article"(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for article_tags
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_tags_unique ON article_tags(article_id, tag_id);

-- Article Media (linking articles to media files)
CREATE TABLE IF NOT EXISTS article_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES "Article"(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL, -- 'featured_image', 'gallery', 'inline', 'attachment'
    sort_order INTEGER DEFAULT 0,
    caption TEXT,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for article_media
CREATE INDEX IF NOT EXISTS idx_article_media_article_id ON article_media(article_id);
CREATE INDEX IF NOT EXISTS idx_article_media_media_file_id ON article_media(media_file_id);
CREATE INDEX IF NOT EXISTS idx_article_media_usage_type ON article_media(usage_type);
CREATE INDEX IF NOT EXISTS idx_article_media_sort_order ON article_media(sort_order);

-- =============================================================================
-- COMMENTS SYSTEM
-- =============================================================================

-- Comments (for articles, matches, etc.)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    
    -- Content reference
    entity_type VARCHAR(100) NOT NULL, -- 'article', 'match', 'player', 'team'
    entity_id UUID NOT NULL,
    
    -- Comment content
    content TEXT NOT NULL,
    content_html TEXT, -- Rendered HTML version
    
    -- Status and moderation
    status VARCHAR(50) DEFAULT 'published', -- 'draft', 'published', 'hidden', 'deleted'
    moderation_status VARCHAR(50) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    moderated_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_reason TEXT,
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON comments(deleted);

-- Comment Reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- 'like', 'dislike', 'love', 'laugh', 'angry'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comment_reactions
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_type ON comment_reactions(reaction_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_unique ON comment_reactions(comment_id, user_id);

-- =============================================================================
-- SEARCH AND INDEXING
-- =============================================================================

-- Search Index for full-text search
CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    title TEXT,
    content TEXT,
    keywords TEXT[],
    search_vector TSVECTOR,
    boost_factor DECIMAL(3,2) DEFAULT 1.0,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for search_index
CREATE INDEX IF NOT EXISTS idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_index_keywords ON search_index USING GIN(keywords);
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_index_unique ON search_index(entity_type, entity_id);

-- =============================================================================
-- MEDIA PROCESSING FUNCTIONS
-- =============================================================================

-- Function to create media file record
CREATE OR REPLACE FUNCTION create_media_file(
    p_uploader_id UUID,
    p_original_filename VARCHAR,
    p_stored_filename VARCHAR,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_mime_type VARCHAR,
    p_file_hash VARCHAR,
    p_media_type VARCHAR DEFAULT 'document',
    p_dimensions JSONB DEFAULT NULL,
    p_duration INTEGER DEFAULT NULL,
    p_visibility VARCHAR DEFAULT 'private'
)
RETURNS UUID AS $$
DECLARE
    media_id UUID;
BEGIN
    -- Check for duplicate files
    SELECT id INTO media_id FROM media_files 
    WHERE file_hash = p_file_hash AND deleted = FALSE;
    
    IF FOUND THEN
        -- Return existing file ID if duplicate found
        RETURN media_id;
    END IF;
    
    -- Create new media file record
    INSERT INTO media_files (
        uploader_id, original_filename, stored_filename, file_path,
        file_size, mime_type, file_hash, media_type, dimensions,
        duration, visibility
    ) VALUES (
        p_uploader_id, p_original_filename, p_stored_filename, p_file_path,
        p_file_size, p_mime_type, p_file_hash, p_media_type, p_dimensions,
        p_duration, p_visibility
    ) RETURNING id INTO media_id;
    
    -- Log the upload activity
    INSERT INTO user_activity_logs (user_id, action, details)
    VALUES (
        p_uploader_id,
        'media_uploaded',
        jsonb_build_object(
            'media_id', media_id,
            'filename', p_original_filename,
            'media_type', p_media_type,
            'file_size', p_file_size
        )
    );
    
    RETURN media_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index(
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_title TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_keywords TEXT[] DEFAULT NULL,
    p_boost_factor DECIMAL DEFAULT 1.0
)
RETURNS void AS $$
DECLARE
    search_content TEXT;
    search_vector TSVECTOR;
BEGIN
    -- Combine title and content for search
    search_content := COALESCE(p_title, '') || ' ' || COALESCE(p_content, '');
    
    -- Create search vector
    search_vector := to_tsvector('english', search_content);
    
    -- Add keywords to search vector if provided
    IF p_keywords IS NOT NULL THEN
        search_vector := search_vector || to_tsvector('english', array_to_string(p_keywords, ' '));
    END IF;
    
    -- Insert or update search index
    INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector, boost_factor)
    VALUES (p_entity_type, p_entity_id, p_title, p_content, p_keywords, search_vector, p_boost_factor)
    ON CONFLICT (entity_type, entity_id)
    DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        keywords = EXCLUDED.keywords,
        search_vector = EXCLUDED.search_vector,
        boost_factor = EXCLUDED.boost_factor,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to search content
CREATE OR REPLACE FUNCTION search_content(
    p_query TEXT,
    p_entity_types VARCHAR[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    entity_type VARCHAR,
    entity_id UUID,
    title TEXT,
    content TEXT,
    rank REAL,
    highlight TEXT
) AS $$
DECLARE
    search_query TSQUERY;
BEGIN
    -- Parse search query
    search_query := plainto_tsquery('english', p_query);
    
    RETURN QUERY
    SELECT 
        si.entity_type,
        si.entity_id,
        si.title,
        si.content,
        ts_rank(si.search_vector, search_query) * si.boost_factor AS rank,
        ts_headline('english', COALESCE(si.content, si.title), search_query) AS highlight
    FROM search_index si
    WHERE si.search_vector @@ search_query
    AND (p_entity_types IS NULL OR si.entity_type = ANY(p_entity_types))
    ORDER BY rank DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC INDEXING
-- =============================================================================

-- Trigger to update search index when articles are modified
CREATE OR REPLACE FUNCTION trigger_update_article_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM search_index WHERE entity_type = 'article' AND entity_id = OLD.id;
        RETURN OLD;
    ELSE
        PERFORM update_search_index(
            'article',
            NEW.id,
            NEW.title,
            NEW.content,
            NEW.tags,
            CASE WHEN NEW.status = 'published' THEN 1.0 ELSE 0.5 END
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_article_search_index
    AFTER INSERT OR UPDATE OR DELETE ON "Article"
    FOR EACH ROW EXECUTE FUNCTION trigger_update_article_search_index();

-- Trigger to update comment counts
CREATE OR REPLACE FUNCTION trigger_update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update parent comment reply count
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE comments 
            SET reply_count = reply_count + 1,
                updated_at = NOW()
            WHERE id = NEW.parent_id;
        END IF;
        
        -- Update article comment count
        IF NEW.entity_type = 'article' THEN
            UPDATE article_metadata 
            SET comment_count = comment_count + 1
            WHERE article_id = NEW.entity_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update parent comment reply count
        IF OLD.parent_id IS NOT NULL THEN
            UPDATE comments 
            SET reply_count = reply_count - 1,
                updated_at = NOW()
            WHERE id = OLD.parent_id;
        END IF;
        
        -- Update article comment count
        IF OLD.entity_type = 'article' THEN
            UPDATE article_metadata 
            SET comment_count = comment_count - 1
            WHERE article_id = OLD.entity_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_counts
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_comment_counts();

-- =============================================================================
-- CONSTRAINTS AND VALIDATION
-- =============================================================================

-- Add constraints
ALTER TABLE media_files ADD CONSTRAINT check_media_type 
CHECK (media_type IN ('image', 'video', 'audio', 'document'));

ALTER TABLE media_files ADD CONSTRAINT check_processing_status 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE media_files ADD CONSTRAINT check_visibility 
CHECK (visibility IN ('public', 'private', 'team_only'));

ALTER TABLE media_files ADD CONSTRAINT check_moderation_status 
CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

ALTER TABLE media_collections ADD CONSTRAINT check_collection_type 
CHECK (type IN ('album', 'gallery', 'playlist'));

ALTER TABLE comments ADD CONSTRAINT check_comment_status 
CHECK (status IN ('draft', 'published', 'hidden', 'deleted'));

ALTER TABLE comments ADD CONSTRAINT check_comment_moderation_status 
CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE comment_reactions ADD CONSTRAINT check_reaction_type 
CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'wow', 'sad'));

-- Add table comments
COMMENT ON TABLE media_files IS 'Centralized media file storage with processing and moderation';
COMMENT ON TABLE media_collections IS 'Organized collections of media files (albums, galleries, playlists)';
COMMENT ON TABLE media_collection_items IS 'Items within media collections with ordering and metadata';
COMMENT ON TABLE content_categories IS 'Hierarchical categorization system for content';
COMMENT ON TABLE content_tags IS 'Tagging system for flexible content organization';
COMMENT ON TABLE article_metadata IS 'Extended metadata for articles including SEO and analytics';
COMMENT ON TABLE article_categories IS 'Many-to-many relationship between articles and categories';
COMMENT ON TABLE article_tags IS 'Many-to-many relationship between articles and tags';
COMMENT ON TABLE article_media IS 'Media files associated with articles';
COMMENT ON TABLE comments IS 'Hierarchical commenting system for various content types';
COMMENT ON TABLE comment_reactions IS 'User reactions to comments';
COMMENT ON TABLE search_index IS 'Full-text search index for content discovery';

-- Insert default content categories
INSERT INTO content_categories (name, slug, description, color, sort_order) VALUES
('News', 'news', 'Latest news and updates', '#FF6B6B', 1),
('Match Reports', 'match-reports', 'Detailed match analysis and reports', '#4ECDC4', 2),
('Player Profiles', 'player-profiles', 'In-depth player profiles and interviews', '#45B7D1', 3),
('Team Analysis', 'team-analysis', 'Team performance and tactical analysis', '#96CEB4', 4),
('Transfer News', 'transfer-news', 'Player transfers and market updates', '#FFEAA7', 5),
('Opinion', 'opinion', 'Editorial content and opinion pieces', '#DDA0DD', 6),
('Statistics', 'statistics', 'Data-driven analysis and statistics', '#98D8C8', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert default content tags
INSERT INTO content_tags (name, slug, description, color) VALUES
('Breaking', 'breaking', 'Breaking news and urgent updates', '#FF0000'),
('Analysis', 'analysis', 'In-depth analysis content', '#0066CC'),
('Interview', 'interview', 'Player and coach interviews', '#9900CC'),
('Preview', 'preview', 'Match and event previews', '#FF9900'),
('Review', 'review', 'Post-match and event reviews', '#006600'),
('Transfer', 'transfer', 'Transfer-related content', '#CC6600'),
('Injury', 'injury', 'Injury news and updates', '#CC0000'),
('Tactical', 'tactical', 'Tactical analysis and breakdowns', '#003366')
ON CONFLICT (slug) DO NOTHING;
