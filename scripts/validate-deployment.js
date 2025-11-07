#!/usr/bin/env node

/**
 * Deployment Validation Script
 * 
 * This script validates that the application is properly configured for deployment.
 * It checks environment variables and configuration files needed for both
 * frontend and backend deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating deployment configuration...\n');

// Check if required files exist
const requiredFiles = [
  '.env.local',
  'vercel.env.example',
  'brixsport-backend/.env.example'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
}

console.log('\n');

// Check frontend environment variables
const frontendEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

// Check if .env.local exists for frontend
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('Frontend Environment Variables:');
  for (const varName of frontendEnvVars) {
    const found = envLines.some(line => line.startsWith(`${varName}=`));
    if (found) {
      console.log(`✅ ${varName} configured`);
    } else {
      console.log(`⚠️  ${varName} not found (optional for development)`);
    }
  }
} else {
  console.log('⚠️  .env.local not found - create it for local development');
}

console.log('\n');

// Check backend environment variables
const backendEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'LOGGER_JWT_SECRET'
];

// Check if backend .env exists
const backendEnvPath = 'brixsport-backend/.env';
if (fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('Backend Environment Variables:');
  for (const varName of backendEnvVars) {
    const found = envLines.some(line => line.startsWith(`${varName}=`));
    if (found) {
      console.log(`✅ ${varName} configured`);
    } else {
      console.log(`❌ ${varName} not found`);
    }
  }
} else {
  console.log('ℹ️  Backend .env not found - this is expected for deployment');
  console.log('   You will configure these in your deployment platform');
}

console.log('\n');

// Check vercel.json configuration
if (fs.existsSync('vercel.json')) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    if (vercelConfig.routes && vercelConfig.routes.length > 0) {
      console.log('✅ vercel.json has routing configuration');
    } else {
      console.log('⚠️  vercel.json routing configuration missing');
    }
  } catch (error) {
    console.log('❌ vercel.json is not valid JSON');
  }
} else {
  console.log('❌ vercel.json not found');
}

console.log('\n');

// Final validation
if (allFilesExist) {
  console.log('✅ All required configuration files exist');
  console.log('\n📋 Deployment Checklist:');
  console.log('1. Deploy backend separately (Render, Heroku, etc.)');
  console.log('2. Set BACKEND_API_URL in Vercel to your deployed backend URL');
  console.log('3. Configure all environment variables in Vercel');
  console.log('4. Deploy frontend to Vercel');
  console.log('\n📝 See DEPLOYMENT_GUIDE.md for detailed instructions');
} else {
  console.log('❌ Some required files are missing');
  console.log('Please check the errors above and ensure all configuration files exist');
  process.exit(1);
}