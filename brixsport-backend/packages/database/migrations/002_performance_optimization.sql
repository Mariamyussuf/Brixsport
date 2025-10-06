-- Performance Optimization Migration
-- This migration adds caching tables, performance indexes, and materialized views

-- Create statistics cache table for frequently accessed data
CREATE TABLE IF NOT EXISTS statistics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for statistics_cache
CREATE INDEX IF NOT EXISTS idx_statistics_cache_key ON statistics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_statistics_cache_type ON statistics_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_statistics_cache_expires_at ON statistics_cache(expires_at);

-- Create user engagement metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_metrics AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COUNT(ual.id) as total_activities,
    COUNT(DISTINCT DATE(ual.created_at)) as active_days,
    COUNT(CASE WHEN ual.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as activities_last_7_days,
    COUNT(CASE WHEN ual.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as activities_last_30_days,
    MAX(ual.created_at) as last_activity,
    CASE 
        WHEN MAX(ual.created_at) >= NOW() - INTERVAL '1 day' THEN 'highly_active'
        WHEN MAX(ual.created_at) >= NOW() - INTERVAL '7 days' THEN 'active'
        WHEN MAX(ual.created_at) >= NOW() - INTERVAL '30 days' THEN 'moderate'
        ELSE 'inactive'
    END as engagement_level,
    -- Calculate engagement score (0-100)
    LEAST(100, GREATEST(0, 
        (COUNT(ual.id) * 2) + 
        (COUNT(DISTINCT DATE(ual.created_at)) * 5) +
        (COUNT(CASE WHEN ual.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) * 3)
    )) as engagement_score
FROM "User" u
LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
WHERE u.deleted = FALSE
GROUP BY u.id, u.email, u.name;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_engagement_metrics_user_id ON user_engagement_metrics(user_id);

DO $$
DECLARE
    match_home_col TEXT;
    match_away_col TEXT;
    match_home_score_col TEXT;
    match_away_score_col TEXT;
    match_competition_col TEXT;
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_team_id'
    ) THEN 'home_team_id' ELSE '"homeTeamId"' END
    INTO match_home_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_team_id'
    ) THEN 'away_team_id' ELSE '"awayTeamId"' END
    INTO match_away_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'home_score'
    ) THEN 'home_score' ELSE '"homeScore"' END
    INTO match_home_score_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'away_score'
    ) THEN 'away_score' ELSE '"awayScore"' END
    INTO match_away_score_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) THEN 'competition_id' ELSE '"competitionId"' END
    INTO match_competition_col;

    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS team_statistics';

    EXECUTE format($f$
        CREATE MATERIALIZED VIEW team_statistics AS
        SELECT 
            t.id as team_id,
            t.name as team_name,
            COUNT(DISTINCT m.id) as total_matches,
            COUNT(CASE WHEN (m.%1$s = t.id AND m.%3$s > m.%4$s) OR 
                            (m.%2$s = t.id AND m.%4$s > m.%3$s) THEN 1 END) as wins,
            COUNT(CASE WHEN m.%3$s = m.%4$s AND m.status = 'finished' THEN 1 END) as draws,
            COUNT(CASE WHEN (m.%1$s = t.id AND m.%3$s < m.%4$s) OR 
                            (m.%2$s = t.id AND m.%4$s < m.%3$s) THEN 1 END) as losses,
            SUM(CASE WHEN m.%1$s = t.id THEN m.%3$s ELSE m.%4$s END) as goals_for,
            SUM(CASE WHEN m.%1$s = t.id THEN m.%4$s ELSE m.%3$s END) as goals_against,
            COUNT(CASE WHEN me.event_type = 'yellow_card' THEN 1 END) as yellow_cards,
            COUNT(CASE WHEN me.event_type = 'red_card' THEN 1 END) as red_cards,
            AVG(CASE WHEN m.%1$s = t.id THEN m.%3$s ELSE m.%4$s END) as avg_goals_for,
            AVG(CASE WHEN m.%1$s = t.id THEN m.%4$s ELSE m.%3$s END) as avg_goals_against
        FROM "Team" t
        LEFT JOIN "Match" m ON (t.id = m.%1$s OR t.id = m.%2$s) AND m.status = 'finished'
        LEFT JOIN match_events me ON m.id = me.match_id AND me.team_id = t.id AND me.deleted = false
        WHERE t.deleted = FALSE
        GROUP BY t.id, t.name;
$f$, match_home_col, match_away_col, match_home_score_col, match_away_score_col);

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_match_competition_status ON "Match"(%s, status);', match_competition_col);
END;
$$;

-- Create unique index for team statistics
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_statistics_team_id ON team_statistics(team_id);

-- Create activity trends materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS activity_trends AS
SELECT 
    DATE(ual.created_at) as activity_date,
    ual.action,
    COUNT(*) as activity_count,
    COUNT(DISTINCT ual.user_id) as unique_users,
    COUNT(DISTINCT ual.ip_address) as unique_ips
FROM user_activity_logs ual
WHERE ual.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(ual.created_at), ual.action
ORDER BY activity_date DESC, activity_count DESC;

-- Create indexes for activity trends
CREATE INDEX IF NOT EXISTS idx_activity_trends_date ON activity_trends(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_trends_action ON activity_trends(action);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY team_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY activity_trends;
    
    -- Clean up expired cache entries
    DELETE FROM statistics_cache WHERE expires_at < NOW();
    
    -- Log the refresh
    INSERT INTO user_activity_logs (user_id, action, details)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, 
        'system_analytics_refresh',
        jsonb_build_object(
            'refreshed_at', NOW(),
            'views_refreshed', ARRAY['user_engagement_metrics', 'team_statistics', 'activity_trends']
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get cached statistics
CREATE OR REPLACE FUNCTION get_cached_statistics(p_cache_key VARCHAR, p_cache_type VARCHAR)
RETURNS JSONB AS $$
DECLARE
    cached_data JSONB;
BEGIN
    SELECT data INTO cached_data
    FROM statistics_cache
    WHERE cache_key = p_cache_key 
    AND cache_type = p_cache_type 
    AND expires_at > NOW();
    
    RETURN cached_data;
END;
$$ LANGUAGE plpgsql;

-- Create function to set cached statistics
CREATE OR REPLACE FUNCTION set_cached_statistics(
    p_cache_key VARCHAR, 
    p_cache_type VARCHAR, 
    p_data JSONB, 
    p_ttl_minutes INTEGER DEFAULT 60
)
RETURNS void AS $$
BEGIN
    INSERT INTO statistics_cache (cache_key, cache_type, data, expires_at)
    VALUES (p_cache_key, p_cache_type, p_data, NOW() + (p_ttl_minutes || ' minutes')::INTERVAL)
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
        data = EXCLUDED.data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_response_time ON performance_metrics(response_time_ms);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status_code ON performance_metrics(status_code);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_action_date ON user_activity_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_created ON chat_messages(match_id, created_at) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_match_events_match_type_minute ON match_events(match_id, event_type, minute) WHERE deleted = false;

-- idx_match_competition_status created in dynamic block above
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"(created_at) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_team_created_at ON "Team"(created_at) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_player_team_status ON "Player"(team_id, status) WHERE deleted = FALSE;

CREATE OR REPLACE FUNCTION warm_up_cache()
RETURNS INTEGER AS $$
DECLARE
    warmed_count INTEGER := 0;
BEGIN
    -- Warm up user engagement metrics
    PERFORM set_cached_statistics(
        'user_engagement_summary',
        'analytics',
        (
            SELECT jsonb_build_object(
                'total_users', COUNT(*),
                'active_users_7d', COUNT(*) FILTER (WHERE engagement_level IN ('highly_active', 'active')),
                'avg_engagement_score', ROUND(AVG(engagement_score), 2)
            )
            FROM user_engagement_metrics
        ),
        120 -- 2 hours TTL
    );
    warmed_count := warmed_count + 1;
    
    -- Warm up team statistics summary
    PERFORM set_cached_statistics(
        'team_stats_summary',
        'analytics',
        (
            SELECT jsonb_build_object(
                'total_teams', COUNT(*),
                'total_matches', SUM(total_matches),
                'avg_goals_per_match', ROUND(AVG(goals_for + goals_against) / NULLIF(AVG(total_matches), 0), 2)
            )
            FROM team_statistics
        ),
        120
    );
    warmed_count := warmed_count + 1;
    
    -- Warm up recent activity trends
    PERFORM set_cached_statistics(
        'recent_activity_trends',
        'analytics',
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', activity_date,
                    'total_activities', SUM(activity_count),
                    'unique_users', SUM(unique_users)
                )
            )
            FROM (
                SELECT activity_date, SUM(activity_count) as activity_count, SUM(unique_users) as unique_users
                FROM activity_trends
                WHERE activity_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY activity_date
                ORDER BY activity_date DESC
                LIMIT 30
            ) recent_trends
        ),
        60
    );
    warmed_count := warmed_count + 1;
    
    RETURN warmed_count;
END;
$$ LANGUAGE plpgsql;

-- Add table comments
COMMENT ON TABLE statistics_cache IS 'Cache table for frequently accessed statistics and analytics data';
COMMENT ON TABLE performance_metrics IS 'API endpoint performance monitoring and metrics';
COMMENT ON MATERIALIZED VIEW user_engagement_metrics IS 'Pre-computed user engagement statistics for analytics dashboard';
COMMENT ON MATERIALIZED VIEW team_statistics IS 'Pre-computed team performance statistics';
COMMENT ON MATERIALIZED VIEW activity_trends IS 'Daily activity trends for the last 90 days';
COMMENT ON FUNCTION warm_up_cache IS 'Warm up frequently accessed cache entries for better performance';

-- Create function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(p_hours INTEGER DEFAULT 24)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'avg_response_time', ROUND(AVG(response_time_ms), 2),
        'p95_response_time', ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 2),
        'p99_response_time', ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms), 2),
        'error_rate', ROUND((COUNT(*) FILTER (WHERE status_code >= 400) * 100.0 / COUNT(*)), 2),
        'top_endpoints', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'endpoint', endpoint,
                    'requests', request_count,
                    'avg_response_time', avg_time
                )
            )
            FROM (
                SELECT 
                    endpoint,
                    COUNT(*) as request_count,
                    ROUND(AVG(response_time_ms), 2) as avg_time
                FROM performance_metrics
                WHERE created_at >= NOW() - (p_hours || ' hours')::INTERVAL
                GROUP BY endpoint
                ORDER BY request_count DESC
                LIMIT 10
            ) top_eps
        )
    ) INTO result
    FROM performance_metrics
    WHERE created_at >= NOW() - (p_hours || ' hours')::INTERVAL;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh materialized views (requires pg_cron extension)
-- SELECT cron.schedule('refresh-analytics', '0 */6 * * *', 'SELECT refresh_analytics_views();');
-- SELECT cron.schedule('warm-cache', '0 */2 * * *', 'SELECT warm_up_cache();');
