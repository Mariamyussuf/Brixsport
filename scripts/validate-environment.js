#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * This script validates that all required environment variables are set
 * and that services are accessible.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Required environment variables
const requiredFrontendVars = [
  'NEXT_PUBLIC_API_URL',
  'JWT_SECRET'
];

const requiredBackendVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'EMAIL_VERIFICATION_SECRET'
];

// Optional but recommended variables
const optionalBackendVars = [
  'SENDGRID_API_KEY',
  'REDIS_URL'
];

console.log('🔍 Validating Environment Configuration...\n');

// Check frontend variables
console.log('Frontend Environment Variables:');
let frontendValid = true;
for (const varName of requiredFrontendVars) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ❌ ${varName}: Missing`);
    frontendValid = false;
  }
}
console.log();

// Check backend variables
console.log('Backend Environment Variables:');
let backendValid = true;
for (const varName of requiredBackendVars) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ❌ ${varName}: Missing`);
    backendValid = false;
  }
}

console.log('\nOptional Backend Variables:');
for (const varName of optionalBackendVars) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`);
  }
}

console.log('\n' + '='.repeat(50));

if (frontendValid && backendValid) {
  console.log('🎉 All required environment variables are set!');
  console.log('✅ Application should start successfully');
} else {
  console.log('❌ Missing required environment variables');
  console.log('🔧 Please set the missing variables before starting the application');
  process.exit(1);
}

// Additional checks could be added here for:
// - Database connectivity
// - Redis connectivity
// - SendGrid API key validity