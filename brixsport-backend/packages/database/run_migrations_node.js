const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Brixsport Database Migration Runner (Node.js)');
  console.log('============================================');
  console.log('');
  console.log('Database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));
  console.log('');

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database successfully!');
    console.log('');

    // Migration files in order
    const migrations = [
      '000_initial_schema.sql',
      '001_add_activity_logging_and_chat.sql',
      '002_performance_optimization.sql',
      '003_analytics_enhancements.sql',
      '004_security_audit.sql',
      '005_notifications_messaging.sql',
      '006_media_content.sql',
      '007_advanced_features.sql',
      '008_add_sport_filtering.sql'
    ];

    console.log('Starting migration process...');
    console.log('');

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);

      const migrationPath = path.join(__dirname, 'migrations', migration);

      if (!fs.existsSync(migrationPath)) {
        console.error(`ERROR: Migration file not found: ${migrationPath}`);
        process.exit(1);
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');
      const startTime = Date.now();

      try {
        await client.query(sql);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log(`✓ Migration ${migration} completed successfully in ${duration.toFixed(2)} seconds.`);
      } catch (error) {
        console.error(`✗ Migration ${migration} failed:`, error.message);
        process.exit(1);
      }

      console.log('');
    }

    console.log('');
    console.log('============================================');
    console.log('All migrations completed successfully!');
    console.log('============================================');
    console.log('');
    console.log('You can now start your application with the new database schema.');

  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);
