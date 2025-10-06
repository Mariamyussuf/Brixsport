#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests Redis connectivity and basic operations
 */

const { createClient } = require('redis');
require('dotenv').config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

console.log('🔄 Testing Redis Connection...');
console.log('Redis URL:', REDIS_URL);
console.log('Redis Password:', REDIS_PASSWORD ? 'SET' : 'NOT SET');

const client = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
  socket: {
    connectTimeout: 5000,
  }
});

// Add event listeners
client.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
  process.exit(1);
});

client.on('connect', () => {
  console.log('✅ Redis Client: Connected');
});

client.on('ready', async () => {
  console.log('✅ Redis Client: Ready');

  try {
    // Test basic operations
    console.log('\n🧪 Testing Redis Operations...');

    // Test SET operation
    await client.set('test_key', 'test_value', { EX: 60 }); // Expires in 60 seconds
    console.log('✅ SET operation successful');

    // Test GET operation
    const value = await client.get('test_key');
    console.log('✅ GET operation successful:', value);

    // Test DEL operation
    await client.del('test_key');
    console.log('✅ DEL operation successful');

    // Test connection info
    const info = await client.info('server');
    console.log('✅ Redis server info retrieved');

    console.log('\n🎉 All Redis tests passed!');
    console.log('Redis is working correctly.');

  } catch (error) {
    console.error('❌ Redis operation failed:', error.message);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('🔌 Redis connection closed');
  }
});

client.on('end', () => {
  console.log('🔌 Redis Client: Disconnected');
});

// Connect to Redis
client.connect().catch((error) => {
  console.error('❌ Failed to connect to Redis:', error.message);
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Make sure Redis server is running on localhost:6379');
  console.log('2. Check if REDIS_URL environment variable is set correctly');
  console.log('3. If using Redis with password, set REDIS_PASSWORD environment variable');
  console.log('4. Try running: redis-server in a terminal to start Redis');
  process.exit(1);
});
