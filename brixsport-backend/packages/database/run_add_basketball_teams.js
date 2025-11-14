const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load backend environment (.env located at brixsport-backend/.env)
const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ Backend .env not found at', envPath);
}

async function run() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not set in environment');
      process.exit(1);
    }

    const sqlFile = path.resolve(__dirname, 'add_basketball_teams.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ SQL file not found:', sqlFile);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');

    const client = new Client({ connectionString: databaseUrl });
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📥 Executing basketball teams SQL...');
    await client.query(sql);
    console.log('✅ Basketball teams inserted (or already present)');

    await client.end();
    console.log('🔚 Done');
  } catch (err) {
    console.error('❌ Failed to add basketball teams');
    console.error(err.message || err);
    process.exit(1);
  }
}

run();