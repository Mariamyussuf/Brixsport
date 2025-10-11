import { createClient, RedisClientOptions } from 'redis';
import { logger } from '../utils/logger';
import { promisify } from 'util';

// Use a local alias for the concrete client type returned by createClient to avoid
// cross-package generic type mismatches with other redis-related packages.
type RedisClient = ReturnType<typeof createClient>;

// Redis client instances with proper type definition
let redisClient: RedisClient | null = null;
let redisClientsPool: RedisClient[] = [];
const MAX_POOL_SIZE = parseInt(process.env.REDIS_POOL_SIZE || '10');

// Redis configuration with defaults
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');
const REDIS_CONNECTION_TIMEOUT = parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000');
const REDIS_COMMAND_TIMEOUT = parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000');
const REDIS_KEEP_ALIVE = process.env.REDIS_KEEP_ALIVE === 'false' ? false : true; // keepAlive must be boolean (true to enable)
const REDIS_TLS = process.env.REDIS_TLS === 'true';
const MAX_RETRIES = parseInt(process.env.REDIS_MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.REDIS_RETRY_DELAY || '1000');

// Metrics
const connectionMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  failedConnections: 0,
  lastError: null as Error | null,
  lastConnectionTime: 0,
  commandsExecuted: 0,
  commandErrors: 0,
};

// Track connection attempts
let connectionAttempts = 0;

// Connection pool management
const getConnectionFromPool = (): RedisClient | null => {
  if (redisClientsPool.length === 0) {
    return null;
  }
  const client = redisClientsPool.pop()!;
  return client;
};

const releaseConnectionToPool = (client: RedisClient) => {
  if (redisClientsPool.length < MAX_POOL_SIZE) {
    redisClientsPool.push(client);
  } else {
    client.quit().catch(err => {
      logger.error('Error closing excess Redis connection:', err);
    });
  }
};

// Health check function
const checkRedisHealth = async (client: RedisClient): Promise<boolean> => {
  try {
    await client.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    connectionMetrics.commandErrors++;
    return false;
  }
};

const createRedisClient = (): RedisClient => {
  // Typed adapter that maps environment variables into the exact socket type
  const buildSocketOptions = (): RedisClientOptions['socket'] => {
    // Redis v4 socket options (Node.js net/TLS socket options plus some redis-specific entries)
    const base: RedisClientOptions['socket'] = {
      // keepAlive: boolean | undefined - true to enable, undefined to disable
      keepAlive: (REDIS_KEEP_ALIVE ? true : undefined) as any,
      connectTimeout: REDIS_CONNECTION_TIMEOUT,
      // For TLS prefer a `rediss://` URL or set TLS options on the URL; omit tls here
    };

    // The redis v4 client does not accept a reconnectStrategy on the socket itself.
    // Reconnection behavior is handled by the client. We therefore keep reconnect logic in code.

    return base;
  };

  const socketConfig = buildSocketOptions();

  const clientConfig: RedisClientOptions = {
    url: REDIS_URL,
    database: REDIS_DB,
    password: REDIS_PASSWORD,
    socket: socketConfig,
    // Command timeout is handled at the application level
    // since the newer Redis client doesn't support it directly in the config
    disableOfflineQueue: true, // Don't queue commands when offline
    readonly: false
    // Redis v4 uses RESP3 protocol by default
  };

  const client = createClient(clientConfig);
  connectionMetrics.totalConnections++;
  
  // Command timeouts should be handled at the application level, as the Redis client does not support 'commandsTimeouts' property.
  connectionMetrics.activeConnections++;

  // Add event listeners with enhanced logging
  client.on('error', (err: any) => {
    logger.error('Redis Client Error:', err);
    connectionMetrics.lastError = err;
    connectionMetrics.commandErrors++;
  });

  client.on('connect', () => {
    logger.info('Redis Client: Connecting...');
    connectionMetrics.lastConnectionTime = Date.now();
  });

  client.on('ready', () => {
    logger.info('Redis Client: Ready');
    connectionAttempts = 0; // Reset on successful connection
    connectionMetrics.lastError = null;
  });

  client.on('reconnecting', () => {
    connectionAttempts++;
    logger.warn(`Redis Client: Reconnecting... (attempt ${connectionAttempts})`);
    connectionMetrics.failedConnections++;
  });

  client.on('end', () => {
    logger.info('Redis Client: Connection closed');
    connectionMetrics.activeConnections--;
  });

  // Add command monitoring
  client.on('command', (args: any[]) => {
    connectionMetrics.commandsExecuted++;
    logger.debug(`Redis Command: ${args[0]}`, { command: args[0], timestamp: new Date() });
  });

  // Add periodic health check
  const healthCheckInterval = setInterval(async () => {
    if (!client.isOpen) return;
    
    const isHealthy = await checkRedisHealth(client);
    if (!isHealthy) {
      logger.warn('Redis health check failed, attempting to recover...');
      try {
        await client.disconnect();
        await client.connect();
      } catch (error) {
        logger.error('Failed to recover Redis connection:', error);
      }
  }
  }, 30000); // Check every 30 seconds

  // Clean up interval on client close
  client.on('end', () => {
    clearInterval(healthCheckInterval);
    logger.info('Redis Client: Disconnected');
  });

  return client;
};

export const connectRedis = async (): Promise<RedisClient> => {
  // Try to get a connection from the pool first
  const pooledClient = getConnectionFromPool();
  if (pooledClient) {
    // Verify the connection is healthy
    const isHealthy = await checkRedisHealth(pooledClient);
    if (isHealthy) {
      return pooledClient;
    }
  }

  if (connectionAttempts >= MAX_RETRIES) {
    throw new Error(`Max Redis connection attempts (${MAX_RETRIES}) reached`);
  }

  try {
    const newClient = createRedisClient();
    await newClient.connect();
    
    // Verify the connection is working
    await newClient.ping();
    
    // If this is the first connection, set it as the default client
    if (!redisClient) {
      redisClient = newClient;
    } else {
      // Add to connection pool if we're under the limit
      if (redisClientsPool.length < MAX_POOL_SIZE) {
        redisClientsPool.push(newClient);
      } else {
        // If pool is full, close the connection and return the client
        // It will be closed when released
        redisClientsPool.push(newClient);
      }
    }
    
    return newClient;
  } catch (error) {
    connectionAttempts++;
    connectionMetrics.failedConnections++;
    connectionMetrics.lastError = error as Error;
    
    logger.error(`Redis connection attempt ${connectionAttempts} failed:`, error);
    
    if (connectionAttempts >= MAX_RETRIES) {
      throw new Error(`Failed to connect to Redis after ${MAX_RETRIES} attempts`);
    }
    
    // Wait before retrying with exponential backoff and jitter
    const backoff = Math.min(1000 * Math.pow(2, connectionAttempts), 10000);
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    
    return connectRedis();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  const disconnectPromises: Promise<void>[] = [];
  
  // Close the main client
  if (redisClient) {
    const quitPromise = redisClient.quit()
      .then(() => {}) // Convert to void
      .catch(error => {
        logger.error('Error disconnecting Redis client:', error);
      });
    disconnectPromises.push(quitPromise);
    redisClient = null;
  }
  logger.info('Redis disconnected successfully');
};
export const getRedisClient = async (): Promise<RedisClient> => {
  if (!redisClient) {
    return await connectRedis();
  }
  
  // Verify the connection is still active
  try {
    await redisClient.ping();
    return redisClient;
  } catch (error) {
    logger.warn('Redis client connection lost, reconnecting...', error);
    return await connectRedis();
  }
};

export const withRedis = async <T>(
  callback: (client: RedisClient) => Promise<T>
): Promise<T> => {
  let client: RedisClient | null = null;
  
  try {
    // Try to get a connection from the pool first
    client = getConnectionFromPool() || await connectRedis();
    
    try {
      const result = await callback(client);
      // Return the client to the pool if successful
      if (client) {
        releaseConnectionToPool(client);
      }
      return result;
    } catch (error) {
      // On error, don't return the client to the pool
      if (client) {
        await client.quit().catch(() => {});
      }
      throw error;
    }
  } catch (error) {
    logger.error('Failed to get Redis client:', error);
    throw error;
  }
};

export const getRedisMetrics = () => ({
  ...connectionMetrics,
  poolSize: redisClientsPool.length,
  maxPoolSize: MAX_POOL_SIZE,
  connectionString: REDIS_URL.replace(/:([^:]+)@/, ':***@'), // Hide password in logs
  lastConnectionTime: new Date(connectionMetrics.lastConnectionTime).toISOString(),
  uptime: connectionMetrics.lastConnectionTime ? 
    Math.floor((Date.now() - connectionMetrics.lastConnectionTime) / 1000) + 's' : 'N/A',
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connections...');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connections...');
  await disconnectRedis();
  process.exit(0);
});