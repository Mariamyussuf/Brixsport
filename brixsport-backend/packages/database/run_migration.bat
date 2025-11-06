@echo off
echo Starting migration to sync Competition table with Prisma schema...

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: psql command not found!
    echo Please ensure PostgreSQL is installed and psql is in your PATH
    echo Or run this migration manually through your database client
    echo.
    echo Manual SQL commands to run:
    echo ========================
    echo ALTER TABLE "Competition" RENAME COLUMN season_id TO "seasonId";
    echo ALTER INDEX IF EXISTS idx_competition_season_id RENAME TO idx_competition_seasonId;
    echo ========================
    pause
    exit /b 1
)

REM Run the migration
psql -U postgres -d brixsport -f migrations\026_sync_competition_table_with_prisma_schema.sql

if %errorlevel% equ 0 (
    echo Migration completed successfully!
    echo.
    echo You can now run the basketball schedule import script:
    echo node import_basketball_schedule_prisma.js
) else (
    echo ERROR: Failed to apply migration
    pause
    exit /b 1
)

pause