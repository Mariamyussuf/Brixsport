-- Featured Content Table
-- Stores dynamic featured content for the platform with scheduling, priority, and analytics

CREATE TABLE IF NOT EXISTS featured_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    link TEXT,
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    ab_test_variant VARCHAR(50), -- For A/B testing support
    view_count INTEGER DEFAULT 0, -- Analytics tracking
    click_count INTEGER DEFAULT 0, -- Analytics tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_content_active ON featured_content(active);
CREATE INDEX IF NOT EXISTS idx_featured_content_priority ON featured_content(priority DESC);
CREATE INDEX IF NOT EXISTS idx_featured_content_dates ON featured_content(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_featured_content_ab_test ON featured_content(ab_test_variant);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_featured_content_updated_at 
    BEFORE UPDATE ON featured_content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_featured_content_updated_at();

-- RLS (Row Level Security) Policies
-- Note: These should be adjusted based on your specific security requirements
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage featured content
CREATE POLICY "Admins can manage featured content" 
ON featured_content 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 
        FROM "User" 
        WHERE "User".id = auth.uid() 
        AND "User".role IN ('admin', 'super-admin')
    )
);

-- Allow public read access to active featured content
CREATE POLICY "Public can view active featured content" 
ON featured_content 
FOR SELECT 
TO anon, authenticated 
USING (
    active = true 
    AND (start_date IS NULL OR start_date <= NOW()) 
    AND (end_date IS NULL OR end_date >= NOW())
);

-- Function to increment view count
CREATE OR REPLACE FUNCTION featured_content_increment_view_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE featured_content 
  SET view_count = view_count + 1 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment click count
CREATE OR REPLACE FUNCTION featured_content_increment_click_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE featured_content 
  SET click_count = click_count + 1 
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE featured_content IS 'Dynamic featured content with scheduling, priority ordering, A/B testing, and analytics';
COMMENT ON COLUMN featured_content.id IS 'Unique identifier for the featured content';
COMMENT ON COLUMN featured_content.title IS 'Title of the featured content';
COMMENT ON COLUMN featured_content.description IS 'Description of the featured content';
COMMENT ON COLUMN featured_content.image_url IS 'URL to the featured image';
COMMENT ON COLUMN featured_content.link IS 'Link when the featured content is clicked';
COMMENT ON COLUMN featured_content.priority IS 'Priority ordering (higher numbers appear first)';
COMMENT ON COLUMN featured_content.active IS 'Whether the content is currently active';
COMMENT ON COLUMN featured_content.start_date IS 'Date when the content should become active';
COMMENT ON COLUMN featured_content.end_date IS 'Date when the content should become inactive';
COMMENT ON COLUMN featured_content.ab_test_variant IS 'A/B testing variant identifier';
COMMENT ON COLUMN featured_content.view_count IS 'Number of times the content has been viewed';
COMMENT ON COLUMN featured_content.click_count IS 'Number of times the content has been clicked';