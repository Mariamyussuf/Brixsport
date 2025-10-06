import { PrismaClient } from '@prisma/client';

// Log the database URL for debugging (without the password)
const dbUrl = process.env.DATABASE_URL || '';
const safeDbUrl = dbUrl.replace(/:([^:]+)@/, ':***@');
console.log('Connecting to database:', safeDbUrl);

// Create a simple Prisma Client instance, just like in the test
const prisma = new PrismaClient();

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to the database...');
    
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
    
  } catch (error: any) {
    console.error('❌ Database connection failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\nTroubleshooting tips:');
      console.log('1. Check if your Supabase database is running');
      console.log('2. Verify your DATABASE_URL in .env is correct');
      console.log('3. Check if your IP is whitelisted in Supabase');
      console.log('4. Try connecting with psql to verify credentials');
    }
    
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error: any) {
    console.error('Database disconnection failed:', error);
    throw error;
  }
};

// Export the prisma client for use in other parts of the application
export { prisma };