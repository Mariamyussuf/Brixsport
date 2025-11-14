# Running Featured Content Migration via CLI

## Quick Start

### Option 1: Using PowerShell Script (Windows)

1. **Set your database connection string:**
   ```powershell
   $env:DATABASE_URL = "postgresql://postgres.rhtwjgvljbapkfmtuqdq:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

2. **Run the migration script:**
   ```powershell
   .\run_featured_content_migration.ps1
   ```

### Option 2: Using Batch Script (Windows)

1. **Set your database connection string:**
   ```cmd
   set DATABASE_URL=postgresql://postgres.rhtwjgvljbapkfmtuqdq:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **Run the migration script:**
   ```cmd
   run_featured_content_migration.bat
   ```

### Option 3: Using psql Directly

1. **Get your connection string from Supabase:**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the "Connection string" (use "Session mode" or "Transaction mode")
   - Replace `[YOUR-PASSWORD]` with your actual database password

2. **Run the migration:**
   ```bash
   psql "postgresql://postgres.rhtwjgvljbapkfmtuqdq:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true" -f "brixsport-backend/packages/database/migrations/007_featured_content.sql"
   ```

### Option 4: Using Supabase CLI

If you have Supabase CLI installed:

1. **Link your project:**
   ```bash
   supabase link --project-ref rhtwjgvljbapkfmtuqdq
   ```

2. **Run the migration:**
   ```bash
   supabase db push
   ```

   Or run a specific migration:
   ```bash
   supabase migration up --file brixsport-backend/packages/database/migrations/007_featured_content.sql
   ```

## Getting Your Database Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **Session mode** or **Transaction mode**
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your database password

**Example connection string format:**
```
postgresql://postgres.rhtwjgvljbapkfmtuqdq:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Installing PostgreSQL Client (psql)

If you don't have `psql` installed:

### Windows (Chocolatey)
```bash
choco install postgresql
```

### Windows (Direct Download)
1. Download from: https://www.postgresql.org/download/windows/
2. Install PostgreSQL (includes psql)
3. Add PostgreSQL bin directory to your PATH

### macOS (Homebrew)
```bash
brew install postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql-client
```

## Troubleshooting

### Error: "psql: command not found"
- Install PostgreSQL client tools (see above)
- Ensure `psql` is in your PATH

### Error: "password authentication failed"
- Verify your database password in the connection string
- Check if your IP is allowed in Supabase → Settings → Database → Connection Pooling

### Error: "could not connect to server"
- Check your internet connection
- Verify the connection string is correct
- Ensure Supabase project is not paused

### Error: "relation already exists"
- The table already exists - this is fine, the migration uses `CREATE TABLE IF NOT EXISTS`
- You can safely ignore this or skip the migration

## Verifying the Migration

After running the migration, verify it worked:

```sql
-- Connect to your database
psql "YOUR_CONNECTION_STRING"

-- Check if table exists
\dt featured_content

-- Or query the table
SELECT * FROM featured_content LIMIT 1;
```

## Manual SQL Execution

If you prefer to run the SQL manually:

1. Open the file: `brixsport-backend/packages/database/migrations/007_featured_content.sql`
2. Copy all the SQL content
3. Connect to your Supabase database using any PostgreSQL client
4. Paste and execute the SQL

## Next Steps

After the migration completes:
1. The `featured_content` table will be created
2. Your app will automatically start using it
3. You can add featured content via your admin panel or directly in Supabase

