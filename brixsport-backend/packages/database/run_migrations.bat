@echo off
REM Brixsport Database Migration Runner
REM This script runs all SQL migrations in the correct order

echo Brixsport Database Migration Runner
echo ==================================
echo.

REM Set database connection from environment
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable not set
    echo Please set your DATABASE_URL environment variable
    pause
    exit /b 1
)

echo Database URL: %DATABASE_URL%
echo.

REM Array of migration files in order
set migrations[0]=000_initial_schema.sql
set migrations[1]=001_add_activity_logging_and_chat.sql
set migrations[2]=002_performance_optimization.sql
set migrations[3]=003_analytics_enhancements.sql
set migrations[4]=004_security_audit.sql
set migrations[5]=005_notifications_messaging.sql
set migrations[6]=006_media_content.sql
set migrations[7]=007_advanced_features.sql

REM Get array length
set /a "len=8"

echo Starting migration process...
echo.

REM Run each migration
for /L %%i in (0,1,%len%-1) do (
    call set migration=%%migrations[%%i]%%
    echo Running migration: !migration!
    echo.

    REM Run the migration using psql
    psql "%DATABASE_URL%" -f "migrations\!migration!" --quiet --no-psqlrc

    if errorlevel 1 (
        echo ERROR: Migration !migration! failed!
        echo Please check the error messages above and fix any issues.
        pause
        exit /b 1
    )

    echo Migration !migration! completed successfully.
    echo.
)

echo.
echo ==================================
echo All migrations completed successfully!
echo ==================================
echo.
echo You can now start your application with the new database schema.
echo.
pause
