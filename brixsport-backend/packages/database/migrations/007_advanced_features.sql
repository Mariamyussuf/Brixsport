-- Advanced Features Migration
-- This migration adds advanced platform features like webhooks, feature flags, experiments, and more

-- =============================================================================
-- WEBHOOKS SYSTEM
-- =============================================================================

-- Webhooks for external integrations
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255), -- For webhook signature verification
    
    -- Event configuration
    events TEXT[] NOT NULL, -- Array of event types to listen for
    filters JSONB DEFAULT '{}', -- Additional filtering criteria
    
    -- Settings
    active BOOLEAN DEFAULT TRUE,
    retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Headers and authentication
    headers JSONB DEFAULT '{}',
    auth_type VARCHAR(50) DEFAULT 'none', -- 'none', 'bearer', 'basic', 'api_key'
    auth_config JSONB DEFAULT '{}',
    
    -- Status tracking
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_webhooks_deleted ON webhooks(deleted);

-- Webhook Deliveries (tracking individual webhook calls)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_id UUID,
    
    -- Request details
    request_url TEXT NOT NULL,
    request_method VARCHAR(10) DEFAULT 'POST',
    request_headers JSONB,
    request_body JSONB,
    
    -- Response details
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    response_time_ms INTEGER,
    
    -- Delivery status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'retrying'
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for webhook_deliveries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- =============================================================================
-- FEATURE FLAGS SYSTEM
-- =============================================================================

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Flag configuration
    flag_type VARCHAR(50) DEFAULT 'boolean', -- 'boolean', 'string', 'number', 'json'
    default_value JSONB NOT NULL,
    
    -- Targeting and rollout
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage DECIMAL(5,2) DEFAULT 0.0, -- 0-100
    targeting_rules JSONB DEFAULT '[]', -- Array of targeting rule objects
    
    -- Environment and context
    environment VARCHAR(50) DEFAULT 'production',
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for feature_flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tags ON feature_flags USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feature_flags_archived ON feature_flags(archived);

-- Feature Flag Evaluations (tracking flag usage)
CREATE TABLE IF NOT EXISTS feature_flag_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    
    -- Evaluation context
    context JSONB DEFAULT '{}', -- User attributes, environment variables, etc.
    result JSONB NOT NULL, -- The evaluated flag value
    variation VARCHAR(100), -- Which variation was served
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    sdk_version VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for feature_flag_evaluations
CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_flag_id ON feature_flag_evaluations(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_user_id ON feature_flag_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_evaluations_created_at ON feature_flag_evaluations(created_at);

-- =============================================================================
-- A/B TESTING AND EXPERIMENTS
-- =============================================================================

-- Experiments
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    
    -- Experiment configuration
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'archived'
    traffic_allocation DECIMAL(5,2) DEFAULT 100.0, -- Percentage of users to include
    
    -- Targeting
    targeting_rules JSONB DEFAULT '[]',
    audience_filters JSONB DEFAULT '{}',
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    duration_days INTEGER,
    
    -- Metrics and goals
    primary_metric VARCHAR(255),
    secondary_metrics TEXT[],
    success_criteria JSONB,
    
    -- Results
    confidence_level DECIMAL(5,2) DEFAULT 95.0,
    statistical_significance BOOLEAN DEFAULT FALSE,
    winner_variation_id UUID,
    results JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    updated_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for experiments
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_created_by ON experiments(created_by);
CREATE INDEX IF NOT EXISTS idx_experiments_start_date ON experiments(start_date);
CREATE INDEX IF NOT EXISTS idx_experiments_end_date ON experiments(end_date);

-- Experiment Variations
CREATE TABLE IF NOT EXISTS experiment_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Variation configuration
    is_control BOOLEAN DEFAULT FALSE,
    traffic_weight DECIMAL(5,2) DEFAULT 50.0, -- Percentage of experiment traffic
    configuration JSONB NOT NULL, -- Variation-specific settings
    
    -- Results tracking
    participant_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for experiment_variations
CREATE INDEX IF NOT EXISTS idx_experiment_variations_experiment_id ON experiment_variations(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_variations_is_control ON experiment_variations(is_control);

-- Experiment Assignments (tracking user assignments to variations)
CREATE TABLE IF NOT EXISTS experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES experiment_variations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    
    -- Assignment context
    assignment_context JSONB DEFAULT '{}',
    sticky BOOLEAN DEFAULT TRUE, -- Whether user should always get same variation
    
    -- Tracking
    first_exposure_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_exposure_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exposure_count INTEGER DEFAULT 1,
    converted BOOLEAN DEFAULT FALSE,
    conversion_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for experiment_assignments
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_id ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variation_id ON experiment_assignments(variation_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user_id ON experiment_assignments(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_experiment_assignments_unique ON experiment_assignments(experiment_id, user_id);

-- =============================================================================
-- FEEDBACK AND SURVEYS
-- =============================================================================

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    
    -- Feedback content
    type VARCHAR(100) NOT NULL, -- 'bug_report', 'feature_request', 'general', 'rating'
    category VARCHAR(100),
    title VARCHAR(255),
    description TEXT NOT NULL,
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    browser_info JSONB,
    screenshot_url TEXT,
    
    -- Metadata
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    tags TEXT[],
    
    -- Ratings (for rating-type feedback)
    rating INTEGER, -- 1-5 or 1-10 scale
    rating_scale INTEGER DEFAULT 5,
    
    -- Internal tracking
    assigned_to UUID REFERENCES "User"(id) ON DELETE SET NULL,
    internal_notes TEXT,
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON feedback(assigned_to);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN(tags);

-- =============================================================================
-- DASHBOARD AND REPORTING
-- =============================================================================

-- Custom Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Dashboard configuration
    layout JSONB NOT NULL, -- Dashboard layout and widget configuration
    filters JSONB DEFAULT '{}', -- Default filters
    refresh_interval INTEGER DEFAULT 300, -- Auto-refresh interval in seconds
    
    -- Access control
    visibility VARCHAR(50) DEFAULT 'private', -- 'private', 'team', 'public'
    access_permissions JSONB DEFAULT '{}',
    
    -- Metadata
    is_template BOOLEAN DEFAULT FALSE,
    template_category VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for dashboards
CREATE INDEX IF NOT EXISTS idx_dashboards_owner_id ON dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_visibility ON dashboards(visibility);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_template ON dashboards(is_template);
CREATE INDEX IF NOT EXISTS idx_dashboards_template_category ON dashboards(template_category);
CREATE INDEX IF NOT EXISTS idx_dashboards_deleted ON dashboards(deleted);

-- Dashboard Shares
CREATE TABLE IF NOT EXISTS dashboard_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES "User"(id) ON DELETE CASCADE,
    
    -- Share configuration
    share_type VARCHAR(50) NOT NULL, -- 'user', 'team', 'public_link'
    permissions JSONB DEFAULT '{"view": true}', -- Permissions granted
    expires_at TIMESTAMP WITH TIME ZONE,
    access_token VARCHAR(255), -- For public link sharing
    
    -- Usage tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for dashboard_shares
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard_id ON dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_shared_by ON dashboard_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_shared_with ON dashboard_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_access_token ON dashboard_shares(access_token);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Report configuration
    report_type VARCHAR(100) NOT NULL, -- 'user_activity', 'match_analytics', 'performance', 'custom'
    query_config JSONB NOT NULL, -- Report query and parameters
    visualization_config JSONB, -- Chart and display configuration
    
    -- Scheduling
    schedule_enabled BOOLEAN DEFAULT FALSE,
    schedule_cron VARCHAR(100), -- Cron expression for scheduling
    schedule_timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Output settings
    output_formats TEXT[] DEFAULT ARRAY['json'], -- 'json', 'csv', 'pdf', 'excel'
    delivery_method VARCHAR(50) DEFAULT 'download', -- 'download', 'email', 'webhook'
    delivery_config JSONB DEFAULT '{}',
    
    -- Execution tracking
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_creator_id ON reports(creator_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_schedule_enabled ON reports(schedule_enabled);
CREATE INDEX IF NOT EXISTS idx_reports_next_run_at ON reports(next_run_at) WHERE schedule_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_reports_active ON reports(active);

-- Report Executions
CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES "User"(id) ON DELETE SET NULL,
    
    -- Execution details
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    
    -- Results
    result_data JSONB,
    result_files JSONB, -- Array of generated file URLs
    row_count INTEGER,
    error_message TEXT,
    
    -- Parameters used
    parameters JSONB,
    filters JSONB
);

-- Create indexes for report_executions
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_triggered_by ON report_executions(triggered_by);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_started_at ON report_executions(started_at);

-- =============================================================================
-- ADVANCED FUNCTIONS
-- =============================================================================

-- Function to evaluate feature flag
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
    p_flag_key VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    flag_record RECORD;
    user_hash INTEGER;
    rollout_bucket INTEGER;
    result JSONB;
BEGIN
    -- Get flag configuration
    SELECT * INTO flag_record FROM feature_flags 
    WHERE key = p_flag_key AND archived = FALSE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('enabled', false, 'value', null, 'reason', 'flag_not_found');
    END IF;
    
    -- Check if flag is enabled
    IF NOT flag_record.enabled THEN
        RETURN jsonb_build_object('enabled', false, 'value', flag_record.default_value, 'reason', 'flag_disabled');
    END IF;
    
    -- Simple rollout percentage check
    IF p_user_id IS NOT NULL THEN
        user_hash := abs(hashtext(p_user_id::text || p_flag_key)) % 100;
        IF user_hash >= flag_record.rollout_percentage THEN
            RETURN jsonb_build_object('enabled', false, 'value', flag_record.default_value, 'reason', 'rollout_percentage');
        END IF;
    END IF;
    
    -- Log evaluation
    INSERT INTO feature_flag_evaluations (flag_id, user_id, context, result)
    VALUES (flag_record.id, p_user_id, p_context, flag_record.default_value);
    
    RETURN jsonb_build_object('enabled', true, 'value', flag_record.default_value, 'reason', 'evaluated');
END;
$$ LANGUAGE plpgsql;

-- Function to trigger webhook
CREATE OR REPLACE FUNCTION trigger_webhook(
    p_event_type VARCHAR,
    p_event_data JSONB,
    p_event_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    webhook_record RECORD;
    delivery_id UUID;
    triggered_count INTEGER := 0;
BEGIN
    -- Find active webhooks that listen for this event type
    FOR webhook_record IN 
        SELECT * FROM webhooks 
        WHERE active = TRUE 
        AND deleted = FALSE 
        AND p_event_type = ANY(events)
    LOOP
        -- Create webhook delivery record
        INSERT INTO webhook_deliveries (
            webhook_id, event_type, event_id, request_url, 
            request_headers, request_body, max_attempts
        ) VALUES (
            webhook_record.id, p_event_type, p_event_id, webhook_record.url,
            webhook_record.headers, p_event_data, webhook_record.retry_attempts
        ) RETURNING id INTO delivery_id;
        
        triggered_count := triggered_count + 1;
        
        -- Update webhook last triggered timestamp
        UPDATE webhooks 
        SET last_triggered_at = NOW(), total_calls = total_calls + 1
        WHERE id = webhook_record.id;
    END LOOP;
    
    RETURN triggered_count;
END;
$$ LANGUAGE plpgsql;

-- Function to assign user to experiment
CREATE OR REPLACE FUNCTION assign_experiment(
    p_experiment_id UUID,
    p_user_id UUID,
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    experiment_record RECORD;
    variation_record RECORD;
    assignment_id UUID;
    user_hash INTEGER;
    cumulative_weight DECIMAL := 0;
    random_value DECIMAL;
BEGIN
    -- Check if user already assigned
    SELECT variation_id INTO assignment_id 
    FROM experiment_assignments 
    WHERE experiment_id = p_experiment_id AND user_id = p_user_id;
    
    IF FOUND THEN
        -- Update last exposure
        UPDATE experiment_assignments 
        SET last_exposure_at = NOW(), exposure_count = exposure_count + 1
        WHERE experiment_id = p_experiment_id AND user_id = p_user_id;
        RETURN assignment_id;
    END IF;
    
    -- Get experiment details
    SELECT * INTO experiment_record FROM experiments 
    WHERE id = p_experiment_id AND status = 'running';
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Generate deterministic random value based on user and experiment
    user_hash := abs(hashtext(p_user_id::text || p_experiment_id::text));
    random_value := (user_hash % 10000) / 100.0; -- 0-99.99
    
    -- Find variation based on traffic weights
    FOR variation_record IN 
        SELECT * FROM experiment_variations 
        WHERE experiment_id = p_experiment_id 
        ORDER BY created_at
    LOOP
        cumulative_weight := cumulative_weight + variation_record.traffic_weight;
        IF random_value < cumulative_weight THEN
            -- Assign user to this variation
            INSERT INTO experiment_assignments (
                experiment_id, variation_id, user_id, assignment_context
            ) VALUES (
                p_experiment_id, variation_record.id, p_user_id, p_context
            );
            
            -- Update variation participant count
            UPDATE experiment_variations 
            SET participant_count = participant_count + 1
            WHERE id = variation_record.id;
            
            RETURN variation_record.id;
        END IF;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CONSTRAINTS AND VALIDATION
-- =============================================================================

-- Add constraints
ALTER TABLE webhooks ADD CONSTRAINT check_webhook_auth_type 
CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key'));

ALTER TABLE webhook_deliveries ADD CONSTRAINT check_webhook_delivery_status 
CHECK (status IN ('pending', 'success', 'failed', 'retrying'));

ALTER TABLE feature_flags ADD CONSTRAINT check_feature_flag_type 
CHECK (flag_type IN ('boolean', 'string', 'number', 'json'));

ALTER TABLE experiments ADD CONSTRAINT check_experiment_status 
CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived'));

ALTER TABLE feedback ADD CONSTRAINT check_feedback_type 
CHECK (type IN ('bug_report', 'feature_request', 'general', 'rating', 'suggestion'));

ALTER TABLE feedback ADD CONSTRAINT check_feedback_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE feedback ADD CONSTRAINT check_feedback_status 
CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate'));

ALTER TABLE dashboards ADD CONSTRAINT check_dashboard_visibility 
CHECK (visibility IN ('private', 'team', 'public'));

ALTER TABLE dashboard_shares ADD CONSTRAINT check_dashboard_share_type 
CHECK (share_type IN ('user', 'team', 'public_link'));

ALTER TABLE reports ADD CONSTRAINT check_report_delivery_method 
CHECK (delivery_method IN ('download', 'email', 'webhook', 'dashboard'));

ALTER TABLE report_executions ADD CONSTRAINT check_report_execution_status 
CHECK (status IN ('running', 'completed', 'failed', 'cancelled'));

-- Add table comments
COMMENT ON TABLE webhooks IS 'Webhook configurations for external integrations';
COMMENT ON TABLE webhook_deliveries IS 'Individual webhook delivery attempts and results';
COMMENT ON TABLE feature_flags IS 'Feature flag configurations for controlled rollouts';
COMMENT ON TABLE feature_flag_evaluations IS 'Feature flag evaluation logs and analytics';
COMMENT ON TABLE experiments IS 'A/B testing experiments configuration';
COMMENT ON TABLE experiment_variations IS 'Variations within A/B testing experiments';
COMMENT ON TABLE experiment_assignments IS 'User assignments to experiment variations';
COMMENT ON TABLE feedback IS 'User feedback, bug reports, and feature requests';
COMMENT ON TABLE dashboards IS 'Custom user dashboards and analytics views';
COMMENT ON TABLE dashboard_shares IS 'Dashboard sharing and access control';
COMMENT ON TABLE reports IS 'Scheduled and on-demand report configurations';
COMMENT ON TABLE report_executions IS 'Report execution history and results';

-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, flag_type, default_value, enabled) VALUES
('new_dashboard_ui', 'New Dashboard UI', 'Enable the new dashboard user interface', 'boolean', 'false', false),
('advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics features', 'boolean', 'false', false),
('real_time_notifications', 'Real-time Notifications', 'Enable real-time push notifications', 'boolean', 'true', true),
('beta_features', 'Beta Features', 'Enable access to beta features', 'boolean', 'false', false),
('maintenance_mode', 'Maintenance Mode', 'Enable maintenance mode banner', 'boolean', 'false', false)
ON CONFLICT (key) DO NOTHING;
