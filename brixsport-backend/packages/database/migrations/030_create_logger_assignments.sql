-- =============================================================================
-- LOGGER ASSIGNMENTS TABLE
-- =============================================================================
-- This table manages the assignment of loggers to competitions and matches
-- Ensures one logger per match at a time and tracks assignment history

CREATE TABLE IF NOT EXISTS "LoggerAssignments" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logger_id UUID NOT NULL,
    competition_id INTEGER,
    match_id INTEGER,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_logger_assignments_logger FOREIGN KEY (logger_id) REFERENCES "Logger"(id) ON DELETE CASCADE,
    CONSTRAINT fk_logger_assignments_competition FOREIGN KEY (competition_id) REFERENCES "Competition"(id) ON DELETE CASCADE,
    CONSTRAINT fk_logger_assignments_match FOREIGN KEY (match_id) REFERENCES "Match"(id) ON DELETE CASCADE,
    
    -- Ensure either competition_id or match_id is set (or both)
    CONSTRAINT check_assignment_target CHECK (competition_id IS NOT NULL OR match_id IS NOT NULL),
    
    -- Unique constraint: one active logger per match at a time
    CONSTRAINT unique_active_match_logger UNIQUE NULLS NOT DISTINCT (match_id, status) 
        WHERE status = 'active' AND match_id IS NOT NULL
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for logger lookups
CREATE INDEX IF NOT EXISTS idx_logger_assignments_logger_id 
    ON "LoggerAssignments"(logger_id);

-- Index for competition lookups
CREATE INDEX IF NOT EXISTS idx_logger_assignments_competition_id 
    ON "LoggerAssignments"(competition_id);

-- Index for match lookups
CREATE INDEX IF NOT EXISTS idx_logger_assignments_match_id 
    ON "LoggerAssignments"(match_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_logger_assignments_status 
    ON "LoggerAssignments"(status);

-- Composite index for active assignments by logger
CREATE INDEX IF NOT EXISTS idx_logger_assignments_logger_status 
    ON "LoggerAssignments"(logger_id, status);

-- Composite index for active match assignments
CREATE INDEX IF NOT EXISTS idx_logger_assignments_match_status 
    ON "LoggerAssignments"(match_id, status) 
    WHERE status = 'active';

-- Index for assignment date range queries
CREATE INDEX IF NOT EXISTS idx_logger_assignments_assigned_at 
    ON "LoggerAssignments"(assigned_at);

-- Index for assigned_by (admin tracking)
CREATE INDEX IF NOT EXISTS idx_logger_assignments_assigned_by 
    ON "LoggerAssignments"(assigned_by);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_logger_assignments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_logger_assignments_timestamp ON "LoggerAssignments";
CREATE TRIGGER trigger_update_logger_assignments_timestamp
    BEFORE UPDATE ON "LoggerAssignments"
    FOR EACH ROW
    EXECUTE FUNCTION update_logger_assignments_timestamp();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE "LoggerAssignments" IS 'Manages logger assignments to competitions and matches with conflict prevention';
COMMENT ON COLUMN "LoggerAssignments".logger_id IS 'Reference to the logger being assigned';
COMMENT ON COLUMN "LoggerAssignments".competition_id IS 'Optional: Competition assignment';
COMMENT ON COLUMN "LoggerAssignments".match_id IS 'Optional: Specific match assignment';
COMMENT ON COLUMN "LoggerAssignments".assigned_by IS 'Admin who made the assignment';
COMMENT ON COLUMN "LoggerAssignments".status IS 'Assignment status: active, completed, or cancelled';
COMMENT ON COLUMN "LoggerAssignments".notes IS 'Additional notes about the assignment';

-- =============================================================================
-- HELPER FUNCTION: Check for assignment conflicts
-- =============================================================================

CREATE OR REPLACE FUNCTION check_logger_assignment_conflict(
    p_logger_id UUID,
    p_match_id INTEGER,
    p_assignment_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- Check if logger has any active assignment for this match
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM "LoggerAssignments"
    WHERE logger_id = p_logger_id
      AND match_id = p_match_id
      AND status = 'active';
    
    RETURN v_conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTION: Get logger assignments
-- =============================================================================

CREATE OR REPLACE FUNCTION get_logger_assignments(
    p_logger_id UUID,
    p_status VARCHAR DEFAULT 'active'
)
RETURNS TABLE (
    assignment_id UUID,
    competition_id INTEGER,
    match_id INTEGER,
    assigned_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        competition_id,
        match_id,
        assigned_at,
        status::VARCHAR
    FROM "LoggerAssignments"
    WHERE logger_id = p_logger_id
      AND (p_status IS NULL OR status = p_status)
    ORDER BY assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERMISSIONS (if using RLS - Row Level Security)
-- =============================================================================

-- Enable RLS if needed
-- ALTER TABLE "LoggerAssignments" ENABLE ROW LEVEL SECURITY;

-- Example policy for loggers to view their own assignments
-- CREATE POLICY logger_view_own_assignments ON "LoggerAssignments"
--     FOR SELECT
--     USING (logger_id = auth.uid());

-- Example policy for admins to manage all assignments
-- CREATE POLICY admin_manage_all_assignments ON "LoggerAssignments"
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM "Admin" 
--             WHERE id = auth.uid() AND role IN ('super-admin', 'admin')
--         )
--     );
