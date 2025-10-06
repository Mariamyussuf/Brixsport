const { Client } = require('pg');

async function checkTables() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log('All tables:', result.rows.map(r => r.table_name));

  // Check specifically for user table
  const userTables = result.rows.filter(r => r.table_name.toLowerCase().includes('user'));
  console.log('User-related tables:', userTables.map(r => r.table_name));

  await client.end();
}

checkTables().catch(console.error);
