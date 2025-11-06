# PowerShell script to run the competition table migration
# This script applies the migration to sync the Competition table with the Prisma schema

Write-Host "Starting migration to sync Competition table with Prisma schema..." -ForegroundColor Green

# Check if psql is available
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlExists) {
    Write-Host "ERROR: psql command not found!" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and psql is in your PATH" -ForegroundColor Yellow
    Write-Host "Or run this migration manually through your database client" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual SQL commands to run:" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Write-Host "ALTER TABLE `"Competition`" RENAME COLUMN season_id TO `"seasonId`";" -ForegroundColor White
    Write-Host "ALTER INDEX IF EXISTS idx_competition_season_id RENAME TO idx_competition_seasonId;" -ForegroundColor White
    Write-Host "========================" -ForegroundColor Cyan
    exit 1
}

# Get database connection details from environment or use defaults
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#].*?)\s*=\s*(.*)$") {
            $name = $matches[1]
            $value = $matches[2] -replace '^["'']|["'']$'
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
}

# Set default values if not in environment
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    $databaseUrl = $env:DIRECT_URL
}
if (-not $databaseUrl) {
    Write-Host "ERROR: No database URL found in environment variables" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL or DIRECT_URL in your .env file" -ForegroundColor Yellow
    exit 1
}

# Parse database URL to extract connection parameters
# Example: postgresql://postgres:password@localhost:5432/brixsport
if ($databaseUrl -match "postgresql://(?<user>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)/(?<database>.+)") {
    $dbUser = $matches["user"]
    $dbPassword = $matches["password"]
    $dbHost = $matches["host"]
    $dbPort = $matches["port"]
    $dbName = $matches["database"]
} else {
    Write-Host "ERROR: Could not parse database URL format" -ForegroundColor Red
    Write-Host "Expected format: postgresql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

# Run the migration
$migrationFile = Join-Path $PSScriptRoot "migrations\026_sync_competition_table_with_prisma_schema.sql"

Write-Host "Applying migration: $migrationFile" -ForegroundColor Green

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $dbPassword

# Run the migration
try {
    $result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $migrationFile 2>&1
    Write-Host $result
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to apply migration" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Clear the password environment variable
    $env:PGPASSWORD = $null
}

Write-Host "You can now run the basketball schedule import script:" -ForegroundColor Green
Write-Host "node import_basketball_schedule_prisma.js" -ForegroundColor White