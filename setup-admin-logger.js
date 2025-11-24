#!/usr/bin/env node

/**
 * Setup script for creating admin/logger users
 * This script helps set up the initial admin and logger users in the database
 */

const { createInterface } = require('readline');
const { randomBytes } = require('crypto');
const bcrypt = require('bcryptjs');

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Function to generate a random secret
const generateSecret = () => randomBytes(32).toString('hex');

// Function to hash a password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

async function main() {
  console.log('🔧 Brixsport Admin/Logger Setup Script');
  console.log('========================================\n');
  
  try {
    // Check if required environment variables are set
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      console.log('⚠️  Warning: The following environment variables are not set:');
      missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
      console.log('\nPlease set these variables in your .env.local file before proceeding.\n');
      
      const proceed = await question('Do you want to continue anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }
    
    // Ask if user wants to generate secrets
    console.log('\n🔐 Secret Generation');
    console.log('--------------------');
    const generateSecrets = await question('Do you want to generate new JWT secrets? (y/N): ');
    
    if (generateSecrets.toLowerCase() === 'y') {
      console.log('\nGenerated Secrets (add these to your .env.local file):');
      console.log('----------------------------------------------------');
      console.log(`JWT_SECRET=${generateSecret()}`);
      console.log(`LOGGER_JWT_SECRET=${generateSecret()}`);
      console.log(`REFRESH_TOKEN_SECRET=${generateSecret()}`);
      console.log(`EMAIL_VERIFICATION_SECRET=${generateSecret()}\n`);
    }
    
    // Ask if user wants to create an admin user
    console.log('\n👑 Admin User Creation');
    console.log('----------------------');
    const createAdmin = await question('Do you want to create an admin user? (y/N): ');
    
    if (createAdmin.toLowerCase() === 'y') {
      const adminName = await question('Admin name: ');
      const adminEmail = await question('Admin email: ');
      const adminPassword = await question('Admin password: ');
      
      // Hash the password
      const hashedPassword = await hashPassword(adminPassword);
      
      console.log('\nAdmin user details (add to your database manually):');
      console.log('---------------------------------------------------');
      console.log(`Name: ${adminName}`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Hashed Password: ${hashedPassword}`);
      console.log(`Role: admin\n`);
    }
    
    // Ask if user wants to create a logger user
    console.log('\n📝 Logger User Creation');
    console.log('-----------------------');
    const createLogger = await question('Do you want to create a logger user? (y/N): ');
    
    if (createLogger.toLowerCase() === 'y') {
      const loggerName = await question('Logger name: ');
      const loggerEmail = await question('Logger email: ');
      const loggerPassword = await question('Logger password: ');
      
      // Hash the password
      const hashedPassword = await hashPassword(loggerPassword);
      
      console.log('\nLogger user details (add to your database manually):');
      console.log('---------------------------------------------------');
      console.log(`Name: ${loggerName}`);
      console.log(`Email: ${loggerEmail}`);
      console.log(`Hashed Password: ${hashedPassword}`);
      console.log(`Role: logger\n`);
    }
    
    console.log('\n✅ Setup completed!');
    console.log('Remember to update your .env.local file with the generated secrets and restart your application.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup script
if (require.main === module) {
  main();
}

module.exports = { generateSecret, hashPassword };