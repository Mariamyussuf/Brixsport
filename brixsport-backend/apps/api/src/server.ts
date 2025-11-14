// Load environment variables explicitly
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Debug information
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Only try to load .env file in development/local environments
// In production (like Railway), environment variables are set directly
if (process.env.NODE_ENV !== 'production') {
  // Try to load .env from multiple possible locations
  const possibleEnvPaths = [
    path.resolve(__dirname, '../../.env'),  // Root directory
    path.resolve(__dirname, '../.env'),     // API directory
    path.resolve(process.cwd(), '.env'),    // Current working directory
  ];

  let envLoaded = false;
  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading .env from: ${envPath}`);
      const envConfig = dotenv.config({ path: envPath });
      if (envConfig.error) {
        console.error(`❌ Error loading .env from ${envPath}:`, envConfig.error);
      } else {
        console.log(`✅ Successfully loaded .env from ${envPath}`);
        envLoaded = true;
        break;
      }
    } else {
      console.log(`ℹ️  .env not found at: ${envPath}`);
    }
  }

  if (!envLoaded) {
    console.warn('⚠️  Warning: No .env file loaded. Assuming environment variables are set directly.');
  }
} else {
  console.log('NODE_ENV is production, skipping .env file loading');
}

// Log environment variables for debugging (without sensitive values)
console.log('\nEnvironment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (first 20 chars: ' + process.env.DATABASE_URL.substring(0, 20) + '...)' : 'NOT SET');

// Verify required environment variables
const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Import after dotenv config
import { server, io } from './app';
import { initSocket } from './sockets';
import { logger } from './utils/logger';
import { connectRedis } from './config/redis';
import { connectDatabase } from './config/database';
import { systemMonitorService } from './services/system-monitor.service';
import { queueService } from './services/queue.service';

// Log environment variables for debugging
logger.info('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
  NODE_ENV: process.env.NODE_ENV
});

// Use PORT from environment variables for Railway deployment
// Default to 4000 for local development
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Redis and Database connections
Promise.all([
  connectRedis().catch(error => {
    logger.warn('Redis connection failed, running in degraded mode:', error.message);
    return null; // Continue without Redis
  }),
  connectDatabase()
])
  .then(([redisClient]) => {
    logger.info('Database connected successfully');
    
    if (redisClient) {
      logger.info('Redis connected successfully');
    } else {
      logger.warn('Running without Redis - some features may be limited');
    }
    
    // Start the server
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`);
      
      // Initialize socket connections
      initSocket(io);
      
      // Start system monitor service
      systemMonitorService.startMonitoring();
      
      // Start queue workers for processing jobs
      queueService.processNotificationJobs();
      logger.info('Queue workers started successfully');
    });
  })
  .catch((error: any) => {
    logger.error('Startup failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  systemMonitorService.stopMonitoring();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  systemMonitorService.stopMonitoring();
});