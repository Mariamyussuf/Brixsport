const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Brixsport Database Migration Runner (Node.js) - Resilient Mode');
  console.log('============================================================');
  console.log('');
  console.log('Database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));
  console.log('');

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database successfully!');
    console.log('');

    // Check existing tables
    const existingTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables.length);
    console.log('');

    // Migration files in order - we'll try each one and skip if it fails due to existing objects
    const migrations = [
      '000_initial_schema.sql',
      '001_add_activity_logging_and_chat.sql',
      '002_performance_optimization.sql',
      '003_analytics_enhancements.sql',
      '004_security_audit.sql',
      '005_notifications_messaging.sql',
      '006_media_content.sql',
      '007_advanced_features.sql',
      '008_add_match_indexes.sql',
      '009_add_sport_filtering.sql',
      '010_improve_match_performance.sql',
      '011_restore_public_schema_permissions.sql',
      '012_rename_match_columns_camel_case.sql',
      '013_rename_match_fk_constraints.sql',
      '014_add_competition_logo.sql',
      '015_add_competition_fields.sql',
      '016_create_track_events.sql',
      '017_notification_preferences.sql'
    ];

    console.log('Starting migration process (skipping already applied migrations)...');
    console.log('');

    let completedMigrations = 0;

    for (const migration of migrations) {
      console.log(`Attempting migration: ${migration}`);

      const migrationPath = path.join(__dirname, 'migrations', migration);

      if (!fs.existsSync(migrationPath)) {
        console.error(`ERROR: Migration file not found: ${migrationPath}`);
        continue;
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');
      const startTime = Date.now();

      try {
        await client.query(sql);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log(`✓ Migration ${migration} completed successfully in ${duration.toFixed(2)} seconds.`);
        completedMigrations++;
      } catch (error) {
        // Always attempt to rollback in case the migration opened a transaction
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          if (!rollbackError.message.includes('no transaction in progress')) {
            console.error('Rollback failed:', rollbackError.message);
          }
        }

        // Check if it's an "already exists" type error - if so, consider it successful
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.message.includes('already defined')) {
          console.log(`⚠ Migration ${migration} skipped (objects already exist).`);
          completedMigrations++;
        } else {
          console.error(`✗ Migration ${migration} failed:`, error.message);
          if (error.stack) {
            console.error(error.stack);
          }
          // Continue with other migrations instead of stopping
          console.log('Continuing with remaining migrations...');
        }
      }

      console.log('');
    }

    console.log('');
    console.log('============================================================');
    console.log(`Migration process completed! ${completedMigrations}/${migrations.length} migrations processed.`);
    console.log('============================================================');
    console.log('');
    console.log('You can now start your application with the database schema.');

    // Final check of tables
    const finalTablesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(`Final table count: ${finalTablesResult.rows[0].count}`);

  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);
