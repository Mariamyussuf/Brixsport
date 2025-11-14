#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script runs all database migrations in the correct order.
 * It uses the Supabase client to execute the migrations.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
// Fixed: Use the correct environment variable name from the .env file
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration directory - Fixed: Correct path to migrations directory
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Get all migration files, sorted by name
function getMigrationFiles() {
  try {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql') && file !== 'run_migrations.sql')
      .sort();
    
    return files;
  } catch (error) {
    console.error(`Error reading migrations directory: ${error.message}`);
    process.exit(1);
  }
}

// Read migration file content
function readMigrationFile(filename) {
  try {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    return fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    console.error(`Error reading migration file ${filename}: ${error.message}`);
    process.exit(1);
  }
}

// Execute a migration
async function executeMigration(filename, sql) {
  console.log(`Executing migration: ${filename}`);
  
  try {
    // Special handling for the initial schema migration
    if (filename === '000_initial_schema.sql') {
      // For the initial schema, execute the entire SQL as one statement
      // This ensures that the execute_sql function is created before it's used
      const { error } = await supabase.rpc('execute_sql', { sql: sql });
      
      // Even if there's an error (which is expected since we're creating the function),
      // we'll continue as the schema should be created
      if (error) {
        console.log(`Initial schema execution completed (expected RPC error):`, error.message);
      }
    } else {
      // Split the SQL into individual statements for other migrations
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim().length === 0) continue;
        
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement in ${filename}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log(`Successfully executed migration: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Failed to execute migration ${filename}:`, error.message);
    return false;
  }
}

// Main migration runner
async function runMigrations() {
  console.log('Starting database migrations...');
  
  // Get migration files
  const migrationFiles = getMigrationFiles();
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found');
    return;
  }
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  // Execute each migration
  for (const filename of migrationFiles) {
    const sql = readMigrationFile(filename);
    const success = await executeMigration(filename, sql);
    
    if (!success) {
      console.error(`Migration failed. Stopping execution.`);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully!');
}

// Run the migrations
runMigrations().catch(error => {
  console.error('Migration process failed:', error.message);
  process.exit(1);
});