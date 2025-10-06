-- Security and Audit Migration
-- This migration adds comprehensive security features and audit trails

-- =============================================================================
-- SECURITY EVENTS AND MONITORING
-- =============================================================================

-- Security Events table for tracking security-related activities
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'login_attempt', 'failed_login', 'password_change', 'suspicious_activity'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- Geolocation data
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security_events
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- API Keys table for API access management
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of permissions
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Rate Limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, or API key
    endpoint VARCHAR(255) NOT NULL,
    requests_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON rate_limits(blocked_until);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique ON rate_limits(identifier, endpoint, window_start);

-- =============================================================================
-- ENHANCED AUDIT SYSTEM
-- =============================================================================

-- Data Change Logs for detailed change tracking
CREATE TABLE IF NOT EXISTS data_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for data_change_logs
CREATE INDEX IF NOT EXISTS idx_data_change_logs_table_name ON data_change_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_data_change_logs_record_id ON data_change_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_data_change_logs_operation ON data_change_logs(operation);
CREATE INDEX IF NOT EXISTS idx_data_change_logs_user_id ON data_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_change_logs_created_at ON data_change_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_data_change_logs_table_record ON data_change_logs(table_name, record_id);

-- System Health Monitoring
CREATE TABLE IF NOT EXISTS system_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    health_status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    response_time_ms INTEGER,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    active_connections INTEGER,
    error_rate DECIMAL(5,2),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system_health_logs
CREATE INDEX IF NOT EXISTS idx_system_health_logs_service_name ON system_health_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_health_status ON system_health_logs(health_status);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_created_at ON system_health_logs(created_at);

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_severity VARCHAR DEFAULT 'info',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (user_id, event_type, severity, ip_address, user_agent, details)
    VALUES (p_user_id, p_event_type, p_severity, p_ip_address, p_user_agent, p_details)
    RETURNING id INTO event_id;
    
    -- If it's a critical event, also log to audit log
    IF p_severity = 'critical' THEN
        INSERT INTO "AuditLog" (user_id, action, entity_type, ip_address, user_agent, new_values)
        VALUES (p_user_id, 'security_event_critical', 'security_events', p_ip_address, p_user_agent, 
                jsonb_build_object('event_id', event_id, 'event_type', p_event_type, 'details', p_details));
    END IF;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR,
    p_endpoint VARCHAR,
    p_limit INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate window start time
    window_start := DATE_TRUNC('hour', NOW()) + 
                   (EXTRACT(MINUTE FROM NOW())::INTEGER / p_window_minutes) * (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Get current count for this window
    SELECT COALESCE(requests_count, 0) INTO current_count
    FROM rate_limits
    WHERE identifier = p_identifier 
    AND endpoint = p_endpoint 
    AND window_start = window_start;
    
    -- If no record exists or count is within limit
    IF current_count IS NULL OR current_count < p_limit THEN
        -- Insert or update the count
        INSERT INTO rate_limits (identifier, endpoint, requests_count, window_start)
        VALUES (p_identifier, p_endpoint, 1, window_start)
        ON CONFLICT (identifier, endpoint, window_start)
        DO UPDATE SET 
            requests_count = rate_limits.requests_count + 1,
            updated_at = NOW();
        
        RETURN TRUE;
    ELSE
        -- Rate limit exceeded
        UPDATE rate_limits 
        SET blocked_until = NOW() + (p_window_minutes || ' minutes')::INTERVAL
        WHERE identifier = p_identifier 
        AND endpoint = p_endpoint 
        AND window_start = window_start;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION cleanup_security_data(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old security events (keep only resolved ones older than retention period)
    DELETE FROM security_events 
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
    AND resolved = TRUE;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old rate limit records
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - '7 days'::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old system health logs (keep last 30 days)
    DELETE FROM system_health_logs 
    WHERE created_at < NOW() - '30 days'::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old data change logs (keep based on retention policy)
    DELETE FROM data_change_logs 
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log the cleanup activity
    INSERT INTO "AuditLog" (user_id, action, entity_type, new_values)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'security_data_cleanup',
        'system',
        jsonb_build_object(
            'deleted_records', deleted_count,
            'retention_days', p_days_to_keep,
            'cleanup_date', NOW()
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUDIT TRIGGERS
-- =============================================================================

-- Generic audit trigger function for data changes
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
BEGIN
    -- Convert OLD and NEW to JSONB
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each(old_data) o
        WHERE o.value IS DISTINCT FROM (new_data->o.key);
    END IF;
    
    -- Insert audit record
    INSERT INTO data_change_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_fields,
        user_id,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((NEW->>'id')::UUID, (OLD->>'id')::UUID),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        COALESCE(
            (NEW->>'updated_by')::UUID,
            (OLD->>'updated_by')::UUID,
            current_setting('app.current_user_id', true)::UUID
        ),
        current_setting('app.current_ip_address', true)::INET
    );
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the original operation if audit fails
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for critical tables
CREATE TRIGGER audit_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON "User"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_team_changes
    AFTER INSERT OR UPDATE OR DELETE ON "Team"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_player_changes
    AFTER INSERT OR UPDATE OR DELETE ON "Player"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_match_changes
    AFTER INSERT OR UPDATE OR DELETE ON "Match"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_system_setting_changes
    AFTER INSERT OR UPDATE OR DELETE ON "SystemSetting"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================================================
-- SECURITY CONSTRAINTS AND POLICIES
-- =============================================================================

-- Add constraints for security tables
ALTER TABLE security_events ADD CONSTRAINT check_security_event_type 
CHECK (event_type IN ('login_attempt', 'failed_login', 'password_change', 'suspicious_activity', 'account_locked', 'permission_change', 'data_export', 'admin_action'));

ALTER TABLE security_events ADD CONSTRAINT check_security_severity 
CHECK (severity IN ('info', 'warning', 'error', 'critical'));

ALTER TABLE api_keys ADD CONSTRAINT check_api_key_rate_limit 
CHECK (rate_limit > 0 AND rate_limit <= 10000);

ALTER TABLE data_change_logs ADD CONSTRAINT check_data_change_operation 
CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'));

ALTER TABLE system_health_logs ADD CONSTRAINT check_health_status 
CHECK (health_status IN ('healthy', 'degraded', 'unhealthy'));

-- Add table comments
COMMENT ON TABLE security_events IS 'Security-related events and incidents tracking';
COMMENT ON TABLE api_keys IS 'API key management with permissions and rate limiting';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking for API endpoints and users';
COMMENT ON TABLE data_change_logs IS 'Detailed audit trail of all data changes';
COMMENT ON TABLE system_health_logs IS 'System health and performance monitoring';

COMMENT ON FUNCTION log_security_event IS 'Log security events with automatic escalation for critical events';
COMMENT ON FUNCTION check_rate_limit IS 'Check and enforce rate limits for API endpoints';
COMMENT ON FUNCTION cleanup_security_data IS 'Clean up old security and audit data based on retention policies';
COMMENT ON FUNCTION audit_trigger_function IS 'Generic audit trigger for tracking data changes';

-- Create scheduled cleanup job (requires pg_cron extension)
-- SELECT cron.schedule('security-cleanup', '0 2 * * 0', 'SELECT cleanup_security_data(90);');
