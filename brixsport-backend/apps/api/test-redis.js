const { createClient } = require('redis');
require('dotenv').config();

// Create Redis client using URL from environment variables
const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: false, // Force disable TLS for testing
    rejectUnauthorized: false
  }
});

console.log('Connecting to Redis at:', process.env.REDIS_URL);

// Log connection events
client.on('connect', () => console.log('🔄 Connecting to Redis...'));
client.on('ready', () => console.log('✅ Redis client connected and ready'));
client.on('error', (err) => console.error('❌ Redis Client Error:', err));
client.on('end', () => console.log('👋 Disconnected from Redis'));

async function testRedisConnection() {
  try {
    // Connect to Redis
    await client.connect();
    
    // Test basic operations
    console.log('\n🔍 Testing basic operations...');
    
    // Set a test key
    await client.set('brixsport:test', 'Hello from Brixsport!');
    console.log('✅ Set test key');
    
    // Get the test key
    const value = await client.get('brixsport:test');
    console.log('✅ Retrieved test value:', value);
    
    // Test key expiration
    await client.setEx('brixsport:temp', 10, 'This will expire in 10 seconds');
    console.log('✅ Set temporary key with expiration');
    
    // Get server info
    const info = await client.info('server');
    console.log('\n📊 Redis Server Info:');
    console.log(info.split('\r\n').filter(line => line && !line.startsWith('#')));
    
    // List all keys (be careful with this in production)
    const keys = await client.keys('*');
    console.log('\n🔑 Available keys:', keys);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) console.log('Error code:', error.code);
    if (error.command) console.log('Failed command:', error.command);
  } finally {
    // Close the connection when done
    if (client.isOpen) {
      await client.quit();
      console.log('\n👋 Connection closed');
    }
    process.exit(0);
  }
}

// Run the test
testRedisConnection();
