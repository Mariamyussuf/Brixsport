-- Database Monitoring and Health Check Script
-- Run these queries periodically to monitor database health

-- ==================================================
-- DATABASE HEALTH CHECKS
-- ==================================================

-- Check database size and growth
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage and effectiveness
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE
        WHEN idx_scan > 0 THEN ROUND((idx_tup_fetch::float / idx_scan) * 100, 2)
        ELSE 0
    END as effectiveness_percentage
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC, effectiveness_percentage DESC;

-- Check for unused indexes (indexes with very low scan counts)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan < 100
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check table bloat (tables with many dead tuples)
SELECT
    schemaname,
    tablename,
    n_dead_tup as dead_tuples,
    n_live_tup as live_tuples,
    CASE
        WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::float / n_live_tup) * 100, 2)
        ELSE 0
    END as bloat_percentage,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY n_dead_tup DESC;

-- Check active connections
SELECT
    datname,
    usename,
    client_addr,
    client_port,
    backend_start,
    query_start,
    state_change,
    state,
    CASE
        WHEN state = 'active' THEN EXTRACT(epoch FROM (NOW() - query_start))
        ELSE NULL
    END as query_duration_seconds
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY backend_start;

-- Check lock waits (potential performance issues)
SELECT
    blocked_locks.pid as blocked_pid,
    blocked_activity.usename as blocked_user,
    blocking_locks.pid as blocking_pid,
    blocking_activity.usename as blocking_user,
    blocked_activity.query as blocked_query,
    blocking_activity.query as blocking_query,
    blocked_activity.state as blocked_state
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database = blocked_locks.database
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.page = blocked_locks.page
    AND blocking_locks.tuple = blocked_locks.tuple
    AND blocking_locks.virtualxid = blocked_locks.virtualxid
    AND blocking_locks.transactionid = blocked_locks.transactionid
    AND blocking_locks.classid = blocked_locks.classid
    AND blocking_locks.objid = blocked_locks.objid
    AND blocking_locks.objsubid = blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- ==================================================
-- PERFORMANCE METRICS QUERIES
-- ==================================================

-- Query execution statistics (requires pg_stat_statements extension)
-- SELECT
--     query,
--     calls,
--     total_time,
--     mean_time,
--     rows,
--     ROUND(total_time / calls, 2) as avg_time_per_call
-- FROM pg_stat_statements
-- WHERE calls > 10
-- ORDER BY total_time DESC
-- LIMIT 20;

-- Check cache hit ratio
SELECT
    'index hit rate' as metric,
    ROUND(sum(idx_blks_hit)::decimal / sum(idx_blks_hit + idx_blks_read) * 100, 2) as value
FROM pg_statio_user_indexes
UNION ALL
SELECT
    'table hit rate' as metric,
    ROUND(sum(heap_blks_hit)::decimal / sum(heap_blks_hit + heap_blks_read) * 100, 2) as value
FROM pg_statio_user_tables;

-- Check autovacuum settings and status
SELECT
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count,
    CASE
        WHEN n_dead_tup > 1000 THEN 'VACUUM NEEDED'
        WHEN n_dead_tup > 500 THEN 'MONITOR CLOSELY'
        ELSE 'HEALTHY'
    END as vacuum_status
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- ==================================================
-- MAINTENANCE RECOMMENDATIONS
-- ==================================================

-- Run this to analyze tables for query optimization
-- ANALYZE VERBOSE;

-- Run this to update table statistics
-- VACUUM ANALYZE;

-- Run this to reclaim space from deleted rows
-- VACUUM FULL;

-- Reindex specific indexes if they're bloated
-- REINDEX INDEX index_name;

-- ==================================================
-- ALERT THRESHOLDS
-- ==================================================

-- Consider alerting if:
-- - Table bloat > 30%
-- - Index hit rate < 95%
-- - Cache hit rate < 95%
-- - Active connections > 80% of max_connections
-- - Lock waits > 5 seconds
-- - Dead tuples > 20% of live tuples
