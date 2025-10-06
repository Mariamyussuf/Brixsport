-- 016_create_track_events.sql
-- Adds TrackEvent and TrackResult support tables for logger features

CREATE TABLE IF NOT EXISTS "TrackEvent" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_track_event_date ON "TrackEvent" (date DESC);
CREATE INDEX IF NOT EXISTS idx_track_event_status ON "TrackEvent" (status);
CREATE INDEX IF NOT EXISTS idx_track_event_type ON "TrackEvent" (event_type);

CREATE TABLE IF NOT EXISTS "TrackResult" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES "TrackEvent"(id) ON DELETE CASCADE,
    participant_id UUID,
    participant_name TEXT,
    result_value NUMERIC,
    unit TEXT,
    position INT,
    notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_track_result_event ON "TrackResult" (event_id);
CREATE INDEX IF NOT EXISTS idx_track_result_position ON "TrackResult" (position);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_track_event_updated_at ON "TrackEvent";
CREATE TRIGGER trg_track_event_updated_at
    BEFORE UPDATE ON "TrackEvent"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_track_result_updated_at ON "TrackResult";
CREATE TRIGGER trg_track_result_updated_at
    BEFORE UPDATE ON "TrackResult"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
