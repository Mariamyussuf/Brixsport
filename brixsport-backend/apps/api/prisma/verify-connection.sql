-- Test database connection
SELECT version();

-- List all databases (if permissions allow)
SELECT datname FROM pg_database WHERE datistemplate = false;

-- Test read access to a table (replace 'users' with an existing table)
-- SELECT * FROM users LIMIT 1;
