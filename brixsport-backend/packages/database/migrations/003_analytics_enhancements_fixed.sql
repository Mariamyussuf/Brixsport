-- Analytics Enhancements Migration
-- This migration adds advanced analytics tables and functions

-- Create user retention analytics table
CREATE TABLE IF NOT EXISTS user_retention_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_month DATE NOT NULL,
    users_count INTEGER NOT NULL,
    retention_data JSONB NOT NULL, -- {month_1: count, month_2: count, ...}
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for retention analytics
CREATE INDEX IF NOT EXISTS idx_user_retention_cohort_month ON user_retention_analytics(cohort_month);
CREATE INDEX IF NOT EXISTS idx_user_retention_calculated_at ON user_retention_analytics(calculated_at);

-- Create real-time analytics table for live dashboard
CREATE TABLE IF NOT EXISTS realtime_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for realtime analytics
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_metric_name ON realtime_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_realtime_analytics_timestamp ON realtime_analytics(timestamp);

-- Create user behavior patterns table
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    page_views JSONB, -- Array of page views with timestamps
    actions JSONB, -- Array of user actions
    session_duration INTEGER, -- in seconds
    device_info JSONB,
    location_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user behavior patterns
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_session_id ON user_behavior_patterns(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_created_at ON user_behavior_patterns(created_at);

-- Create advanced analytics functions

-- Function to calculate user retention rates
CREATE OR REPLACE FUNCTION calculate_user_retention(p_start_date DATE, p_end_date DATE)
RETURNS TABLE(
    cohort_month DATE,
    total_users INTEGER,
    month_1_retention NUMERIC,
    month_2_retention NUMERIC,
    month_3_retention NUMERIC,
    month_6_retention NUMERIC,
    month_12_retention NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH cohorts AS (
        SELECT 
            DATE_TRUNC('month', u.created_at)::DATE as cohort_month,
            u.id as user_id,
            u.created_at
        FROM "User" u
        WHERE DATE_TRUNC('month', u.created_at)::DATE BETWEEN p_start_date AND p_end_date
        AND u.deleted = FALSE
    ),
    user_activities AS (
        SELECT 
            c.cohort_month,
            c.user_id,
            DATE_TRUNC('month', ual.created_at)::DATE as activity_month,
            ROW_NUMBER() OVER (PARTITION BY c.user_id ORDER BY DATE_TRUNC('month', ual.created_at)) as month_number
        FROM cohorts c
        LEFT JOIN user_activity_logs ual ON c.user_id = ual.user_id
        WHERE ual.created_at >= c.created_at
    )
    SELECT 
        c.cohort_month,
        COUNT(DISTINCT c.user_id)::INTEGER as total_users,
        ROUND(COUNT(DISTINCT CASE WHEN ua.month_number >= 2 THEN ua.user_id END) * 100.0 / COUNT(DISTINCT c.user_id), 2) as month_1_retention,
        ROUND(COUNT(DISTINCT CASE WHEN ua.month_number >= 3 THEN ua.user_id END) * 100.0 / COUNT(DISTINCT c.user_id), 2) as month_2_retention,
        ROUND(COUNT(DISTINCT CASE WHEN ua.month_number >= 4 THEN ua.user_id END) * 100.0 / COUNT(DISTINCT c.user_id), 2) as month_3_retention,
        ROUND(COUNT(DISTINCT CASE WHEN ua.month_number >= 7 THEN ua.user_id END) * 100.0 / COUNT(DISTINCT c.user_id), 2) as month_6_retention,
        ROUND(COUNT(DISTINCT CASE WHEN ua.month_number >= 13 THEN ua.user_id END) * 100.0 / COUNT(DISTINCT c.user_id), 2) as month_12_retention
    FROM cohorts c
    LEFT JOIN user_activities ua ON c.user_id = ua.user_id AND c.cohort_month = ua.cohort_month
    GROUP BY c.cohort_month
    ORDER BY c.cohort_month;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time activity metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    active_users INTEGER;
    total_matches_today INTEGER;
    chat_messages_today INTEGER;
    avg_response_time NUMERIC;
BEGIN
    -- Count active users (last 5 minutes)
    SELECT COUNT(DISTINCT user_id) INTO active_users
    FROM user_activity_logs
    WHERE created_at >= NOW() - INTERVAL '5 minutes';
    
    -- Count matches today
    SELECT COUNT(*) INTO total_matches_today
    FROM "Match"
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Count chat messages today
    SELECT COUNT(*) INTO chat_messages_today
    FROM chat_messages
    WHERE DATE(created_at) = CURRENT_DATE AND deleted = false;
    
    -- Calculate average response time (last hour)
    SELECT COALESCE(AVG(response_time_ms), 0) INTO avg_response_time
    FROM performance_metrics
    WHERE created_at >= NOW() - INTERVAL '1 hour';
    
    -- Build result JSON
    result := jsonb_build_object(
        'active_users', active_users,
        'matches_today', total_matches_today,
        'chat_messages_today', chat_messages_today,
        'avg_response_time_ms', avg_response_time,
        'timestamp', NOW()
    );
    
    -- Store in realtime analytics table
    INSERT INTO realtime_analytics (metric_name, metric_value, metric_metadata)
    VALUES 
        ('active_users', active_users, jsonb_build_object('period', '5_minutes')),
        ('matches_today', total_matches_today, jsonb_build_object('date', CURRENT_DATE)),
        ('chat_messages_today', chat_messages_today, jsonb_build_object('date', CURRENT_DATE)),
        ('avg_response_time', avg_response_time, jsonb_build_object('period', '1_hour'));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze user engagement patterns
CREATE OR REPLACE FUNCTION analyze_user_engagement(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    activity_count INTEGER;
    favorite_actions TEXT[];
    peak_hours INTEGER[];
    engagement_trend TEXT;
BEGIN
    -- Get activity count for the last 30 days
    SELECT COUNT(*) INTO activity_count
    FROM user_activity_logs
    WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Get favorite actions
    SELECT ARRAY_AGG(action ORDER BY action_count DESC) INTO favorite_actions
    FROM (
        SELECT action, COUNT(*) as action_count
        FROM user_activity_logs
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY action
        LIMIT 5
    ) top_actions;
    
    -- Get peak activity hours
    SELECT ARRAY_AGG(hour ORDER BY activity_count DESC) INTO peak_hours
    FROM (
        SELECT EXTRACT(HOUR FROM created_at)::INTEGER as hour, COUNT(*) as activity_count
        FROM user_activity_logs
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY activity_count DESC
        LIMIT 3
    ) peak_activity;
    
    -- Determine engagement trend
    WITH weekly_activity AS (
        SELECT 
            DATE_TRUNC('week', created_at) as week,
            COUNT(*) as activities
        FROM user_activity_logs
        WHERE user_id = p_user_id AND created_at >= NOW() - INTERVAL '4 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week
    )
    SELECT 
        CASE 
            WHEN COUNT(*) < 2 THEN 'insufficient_data'
            WHEN (LAST_VALUE(activities) OVER (ORDER BY week ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)) > 
                 (FIRST_VALUE(activities) OVER (ORDER BY week ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)) THEN 'increasing'
            WHEN (LAST_VALUE(activities) OVER (ORDER BY week ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)) < 
                 (FIRST_VALUE(activities) OVER (ORDER BY week ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)) THEN 'decreasing'
            ELSE 'stable'
        END INTO engagement_trend
    FROM weekly_activity;
    
    -- Build result
    result := jsonb_build_object(
        'user_id', p_user_id,
        'activity_count_30_days', activity_count,
        'favorite_actions', favorite_actions,
        'peak_hours', peak_hours,
        'engagement_trend', engagement_trend,
        'analyzed_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate activity heatmap data
CREATE OR REPLACE FUNCTION generate_activity_heatmap(p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH daily_activity AS (
        SELECT 
            DATE(created_at) as activity_date,
            EXTRACT(HOUR FROM created_at)::INTEGER as hour,
            COUNT(*) as activity_count
        FROM user_activity_logs
        WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
    ),
    heatmap_data AS (
        SELECT 
            activity_date,
            jsonb_object_agg(hour::TEXT, activity_count) as hourly_data
        FROM daily_activity
        GROUP BY activity_date
        ORDER BY activity_date
    )
    SELECT jsonb_object_agg(activity_date::TEXT, hourly_data) INTO result
    FROM heatmap_data;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update realtime analytics on activity
CREATE OR REPLACE FUNCTION update_realtime_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update active users count
    INSERT INTO realtime_analytics (metric_name, metric_value, metric_metadata)
    VALUES (
        'new_activity',
        1,
        jsonb_build_object(
            'user_id', NEW.user_id,
            'action', NEW.action,
            'ip_address', NEW.ip_address
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_activity_logs
CREATE TRIGGER trigger_update_realtime_analytics
    AFTER INSERT ON user_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_realtime_analytics();

-- Create function to get advanced analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    user_growth JSONB;
    engagement_stats JSONB;
    retention_data JSONB;
BEGIN
    -- User growth metrics
    SELECT jsonb_build_object(
        'new_users_period', COUNT(*) FILTER (WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL),
        'total_users', COUNT(*),
        'growth_rate', ROUND(
            (COUNT(*) FILTER (WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL) * 100.0 / 
             NULLIF(COUNT(*) FILTER (WHERE created_at < NOW() - (p_days || ' days')::INTERVAL), 0)), 2
        )
    ) INTO user_growth
    FROM "User" WHERE deleted = FALSE;
    
    -- Engagement statistics
    SELECT jsonb_build_object(
        'highly_active_users', COUNT(*) FILTER (WHERE engagement_level = 'highly_active'),
        'active_users', COUNT(*) FILTER (WHERE engagement_level = 'active'),
        'moderate_users', COUNT(*) FILTER (WHERE engagement_level = 'moderate'),
        'inactive_users', COUNT(*) FILTER (WHERE engagement_level = 'inactive'),
        'avg_engagement_score', ROUND(AVG(engagement_score), 2)
    ) INTO engagement_stats
    FROM user_engagement_metrics;
    
    -- Recent retention data
    SELECT jsonb_build_object(
        'cohorts_analyzed', COUNT(*),
        'avg_month_1_retention', ROUND(AVG(month_1_retention), 2),
        'avg_month_3_retention', ROUND(AVG(month_3_retention), 2)
    ) INTO retention_data
    FROM calculate_user_retention(
        (CURRENT_DATE - INTERVAL '12 months')::DATE,
        CURRENT_DATE
    );
    
    -- Combine all metrics
    result := jsonb_build_object(
        'user_growth', user_growth,
        'engagement', engagement_stats,
        'retention', retention_data,
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to track conversion events
CREATE OR REPLACE FUNCTION track_conversion_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_event_data JSONB DEFAULT '{}',
    p_value DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    -- Insert into realtime analytics
    INSERT INTO realtime_analytics (metric_name, metric_value, metric_metadata)
    VALUES (
        'conversion_event',
        COALESCE(p_value, 1),
        jsonb_build_object(
            'user_id', p_user_id,
            'event_type', p_event_type,
            'event_data', p_event_data
        )
    ) RETURNING id INTO event_id;
    
    -- Log user activity
    INSERT INTO user_activity_logs (user_id, action, details)
    VALUES (
        p_user_id,
        'conversion_' || p_event_type,
        jsonb_build_object(
            'event_id', event_id,
            'value', p_value,
            'data', p_event_data
        )
    );
    
    -- Update experiment conversions if user is in any experiments
    UPDATE experiment_assignments 
    SET converted = TRUE, conversion_at = NOW()
    WHERE user_id = p_user_id AND converted = FALSE;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_analytics_data(p_retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old realtime analytics (keep last 90 days)
    DELETE FROM realtime_analytics 
    WHERE timestamp < NOW() - '90 days'::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old user behavior patterns
    DELETE FROM user_behavior_patterns 
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Clean up old feature flag evaluations (keep last 180 days)
    DELETE FROM feature_flag_evaluations 
    WHERE created_at < NOW() - '180 days'::INTERVAL;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Log cleanup activity
    INSERT INTO user_activity_logs (user_id, action, details)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'analytics_data_cleanup',
        jsonb_build_object(
            'deleted_records', deleted_count,
            'retention_days', p_retention_days,
            'cleanup_date', NOW()
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add table comments
COMMENT ON TABLE user_retention_analytics IS 'Pre-calculated user retention metrics by cohort';
COMMENT ON TABLE realtime_analytics IS 'Real-time metrics for live dashboard updates';
COMMENT ON TABLE user_behavior_patterns IS 'Detailed user behavior tracking for analytics';

COMMENT ON FUNCTION calculate_user_retention IS 'Calculate user retention rates by monthly cohorts';
COMMENT ON FUNCTION get_realtime_metrics IS 'Get current real-time platform metrics';
COMMENT ON FUNCTION analyze_user_engagement IS 'Analyze individual user engagement patterns';
COMMENT ON FUNCTION generate_activity_heatmap IS 'Generate activity heatmap data for visualization';
COMMENT ON FUNCTION get_analytics_summary IS 'Get comprehensive analytics summary for dashboards';
COMMENT ON FUNCTION track_conversion_event IS 'Track conversion events for analytics and experiments';
COMMENT ON FUNCTION cleanup_analytics_data IS 'Clean up old analytics data based on retention policies';


