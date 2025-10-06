# Brixsport Database Migration Runner
# This script runs all SQL migrations in the correct order

param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "Brixsport Database Migration Runner" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Please set your DATABASE_URL environment variable or pass it as a parameter:" -ForegroundColor Yellow
    Write-Host ".\run_migrations.ps1 -DatabaseUrl 'postgresql://postgres.rhtwjgvljbapkfmtuqdq:FSDeAs2NdEmECyvG@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Database URL: $DatabaseUrl" -ForegroundColor Green
Write-Host ""

# Migration files in order
$migrations = @(
    "000_initial_schema.sql",
    "001_add_activity_logging_and_chat.sql",
    "002_performance_optimization.sql",
    "003_analytics_enhancements.sql",
    "004_security_audit.sql",
    "005_notifications_messaging.sql",
    "006_media_content.sql",
    "007_advanced_features.sql"
)

Write-Host "Starting migration process..." -ForegroundColor Cyan
Write-Host ""

# Run each migration
foreach ($migration in $migrations) {
    Write-Host "Running migration: $migration" -ForegroundColor Yellow
    Write-Host ""

    $migrationPath = Join-Path $PSScriptRoot "migrations\$migration"

    if (-not (Test-Path $migrationPath)) {
        Write-Host "ERROR: Migration file not found: $migrationPath" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Run the migration using psql
    $startTime = Get-Date

    try {
        $process = Start-Process -FilePath "psql" -ArgumentList "`"$DatabaseUrl`" -f `"$migrationPath`" --quiet --no-psqlrc" -NoNewWindow -Wait -PassThru

        if ($process.ExitCode -ne 0) {
            Write-Host "ERROR: Migration $migration failed with exit code $($process.ExitCode)!" -ForegroundColor Red
            Write-Host "Please check the error messages above and fix any issues." -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }

        $endTime = Get-Date
        $duration = $endTime - $startTime

        Write-Host "Migration $migration completed successfully in $($duration.TotalSeconds) seconds." -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Failed to execute migration $migration" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "All migrations completed successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start your application with the new database schema." -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
