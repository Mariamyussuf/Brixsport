// test-connection.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');

    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');

    // Get PostgreSQL version
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL Version:', version[0].version.split(' ')[1]);

    // Get current tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Current tables:', tables.map(t => t.table_name));

    // Get table count
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('📈 Total tables:', tableCount[0].count);

    console.log('🎉 Connection test completed successfully!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
