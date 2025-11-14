import { createClient, RedisClientOptions, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { logger } from '../utils/logger';
import { promisify } from 'util';
import { CircuitBreakerFactory } from '@brixsport/shared/circuit-breaker';
import { globalCacheMetrics } from '@brixsport/shared/cache-metrics';

// Use a more specific type definition to avoid conflicts
type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

// Enhanced Redis client with metadata
interface PooledRedisClient extends RedisClient {
  lastUsed: number;
  createdAt: number;
  usageCount: number;
  isHealthy: boolean;
}

// Redis client instances with proper type definition
let redisClient: RedisClient | null = null;
let redisClientsPool: PooledRedisClient[] = [];
const MIN_POOL_SIZE = parseInt(process.env.REDIS_MIN_POOL_SIZE || '2');
const MAX_POOL_SIZE = parseInt(process.env.REDIS_POOL_SIZE || '10');
const POOL_IDLE_TIMEOUT = parseInt(process.env.REDIS_POOL_IDLE_TIMEOUT || '300000'); // 5 minutes
const POOL_ACQUIRE_TIMEOUT = parseInt(process.env.REDIS_POOL_ACQUIRE_TIMEOUT || '5000'); // 5 seconds
const POOL_MAX_WAITING = parseInt(process.env.REDIS_POOL_MAX_WAITING || '50'); // Max waiting requests

// Pool statistics
const poolStats = {
  totalAcquired: 0,
  totalReleased: 0,
  totalCreated: 0,
  totalDestroyed: 0,
  waitingRequests: 0,
  maxWaitingTime: 0
};

// Waiting queue for pool acquisition
const waitingQueue: Array<() => void> = [];

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
  poolHits: 0,
  poolMisses: 0,
};

// Circuit breaker for Redis operations
const redisCircuitBreaker = CircuitBreakerFactory.create('redis-main', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringPeriod: 120000,
  volumeThreshold: 10
});

// Track connection attempts
let connectionAttempts = 0;

// Connection pool management
const getConnectionFromPool = async (): Promise<PooledRedisClient | null> => {
  // First try to get a healthy connection from the pool
  let client: PooledRedisClient | null = null;
  
  // Try to find a healthy client in the pool
  for (let i = redisClientsPool.length - 1; i >= 0; i--) {
    const pooledClient = redisClientsPool[i];
    if (pooledClient.isHealthy) {
      // Remove from pool
      redisClientsPool.splice(i, 1);
      client = pooledClient;
      break;
    }
  }
  
  if (!client) {
    connectionMetrics.poolMisses++;
    return null;
  }
  
  connectionMetrics.poolHits++;
  client.lastUsed = Date.now();
  client.usageCount++;
  
  // Verify connection is still healthy
  try {
    await client.ping();
    client.isHealthy = true;
  } catch (error) {
    logger.warn('Pooled Redis connection is no longer healthy:', error);
    client.isHealthy = false;
    connectionMetrics.commandErrors++;
    return null;
  }
  
  return client;
};

const releaseConnectionToPool = (client: PooledRedisClient) => {
  if (!client.isOpen) {
    logger.warn('Attempted to release closed Redis connection');
    connectionMetrics.activeConnections--;
    poolStats.totalDestroyed++;
    return;
  }

  // Update client metadata
  client.lastUsed = Date.now();
  
  // Check if pool is full
  if (redisClientsPool.length < MAX_POOL_SIZE) {
    redisClientsPool.push(client);
    poolStats.totalReleased++;
  } else {
    // Pool is full, close excess connection
    client.quit().catch(err => {
      logger.error('Error closing excess Redis connection:', err);
    });
    connectionMetrics.activeConnections--;
    poolStats.totalDestroyed++;
  }
  
  // Process waiting requests if any
  if (waitingQueue.length > 0 && redisClientsPool.length > 0) {
    const next = waitingQueue.shift();
    if (next) next();
  }
};

// Pre-warm connection pool
const warmConnectionPool = async (): Promise<void> => {
  const warmCount = Math.min(MIN_POOL_SIZE, MAX_POOL_SIZE);
  logger.info(`Warming connection pool with ${warmCount} connections`);
  
  for (let i = 0; i < warmCount; i++) {
    try {
      const client = createRedisClient() as PooledRedisClient;
      // Add metadata to the client
      client.lastUsed = Date.now();
      client.createdAt = Date.now();
      client.usageCount = 0;
      client.isHealthy = true;
      
      await client.connect();
      await client.ping();
      redisClientsPool.push(client);
      poolStats.totalCreated++;
    } catch (error) {
      logger.error(`Failed to warm connection ${i + 1}:`, error);
    }
  }
  
  logger.info(`Connection pool warmed: ${redisClientsPool.length} connections`);
};

// Clean up idle connections
const cleanupIdleConnections = async (): Promise<void> => {
  const now = Date.now();
  
  // Remove idle connections that exceed the timeout
  const idleConnections = redisClientsPool.filter(client => 
    now - client.lastUsed > POOL_IDLE_TIMEOUT
  );
  
  // Keep at least MIN_POOL_SIZE connections
  const excessCount = Math.max(0, idleConnections.length - (redisClientsPool.length - MIN_POOL_SIZE));
  
  if (excessCount > 0) {
    const toRemove = idleConnections.slice(0, excessCount);
    
    for (const client of toRemove) {
      const index = redisClientsPool.indexOf(client);
      if (index !== -1) {
        redisClientsPool.splice(index, 1);
        await client.quit().catch(err => {
          logger.error('Error closing idle connection:', err);
        });
        connectionMetrics.activeConnections--;
        poolStats.totalDestroyed++;
      }
    }
    
    logger.info(`Cleaned up ${toRemove.length} idle connections`);
  }
};

// Start periodic cleanup
setInterval(() => {
  cleanupIdleConnections().catch(err => {
    logger.error('Error during idle connection cleanup:', err);
  });
}, 60000); // Check every minute

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

export const connectRedis = async (): Promise<RedisClient | null> => {
  // Check if Redis is disabled (empty REDIS_URL)
  if (!REDIS_URL || REDIS_URL === '' || REDIS_URL === 'disabled') {
    logger.info('Redis is disabled - running in degraded mode');
    return null;
  }

  // Try to get a connection from the pool first
  const pooledClient = await getConnectionFromPool();
  if (pooledClient) {
    return pooledClient as unknown as RedisClient;
  }

  // If pool is empty, check if we can create a new connection
  if (connectionMetrics.activeConnections >= MAX_POOL_SIZE) {
    // Pool is at max capacity, wait for a connection to be released
    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout;
      
      // Set timeout for waiting
      timeout = setTimeout(() => {
        const index = waitingQueue.indexOf(() => {});
        if (index !== -1) waitingQueue.splice(index, 1);
        reject(new Error('Redis connection pool acquire timeout'));
      }, POOL_ACQUIRE_TIMEOUT);
      
      // Add to waiting queue
      waitingQueue.push(() => {
        clearTimeout(timeout);
        // Try to get connection again
        connectRedis().then(resolve).catch(reject);
      });
      
      poolStats.waitingRequests = waitingQueue.length;
    });
  }

  if (connectionAttempts >= MAX_RETRIES) {
    logger.warn(`Max Redis connection attempts (${MAX_RETRIES}) reached - running without Redis`);
    return null;
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
        const pooledClient = newClient as PooledRedisClient;
        // Add metadata to the client
        pooledClient.lastUsed = Date.now();
        pooledClient.createdAt = Date.now();
        pooledClient.usageCount = 0;
        pooledClient.isHealthy = true;
        redisClientsPool.push(pooledClient);
        poolStats.totalCreated++;
      }
    }
    
    poolStats.totalAcquired++;
    return newClient;
  } catch (error) {
    connectionAttempts++;
    connectionMetrics.failedConnections++;
    connectionMetrics.lastError = error as Error;
    
    logger.error(`Redis connection attempt ${connectionAttempts} failed:`, error);
    
    if (connectionAttempts >= MAX_RETRIES) {
      logger.warn(`Failed to connect to Redis after ${MAX_RETRIES} attempts - running without Redis`);
      return null;
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
    const client = await connectRedis();
    if (!client) {
      throw new Error('Redis client not available');
    }
    return client as RedisClient;
  }
  
  // Verify the connection is still active
  try {
    await redisClient.ping();
    return redisClient;
  } catch (error) {
    logger.warn('Redis client connection lost, reconnecting...', error);
    const client = await connectRedis();
    if (!client) {
      throw new Error('Redis client not available');
    }
    return client as RedisClient;
  }
};

// New function that returns null instead of throwing when Redis is not available
export const getOptionalRedisClient = async (): Promise<RedisClient | null> => {
  try {
    return await getRedisClient();
  } catch (error) {
    return null;
  }
};

export const withRedis = async <T>(
  callback: (client: RedisClient) => Promise<T>
): Promise<T> => {
  // First check if Redis is configured and available
  const redisAvailable = await getOptionalRedisClient();
  if (!redisAvailable) {
    // If Redis is not available, throw an error that can be caught by the caller
    throw new Error('Redis is not available');
  }
  
  let client: PooledRedisClient | null = null;
  
  try {
    // Try to get a connection from the pool first
    client = (await getConnectionFromPool()) || (await connectRedis() as unknown as PooledRedisClient);
    
    // If we still don't have a client, throw an error
    if (!client) {
      throw new Error('Redis client not available');
    }
    
    try {
      const result = await callback(client);
      // Return the client to the pool if successful
      if (client) {
        releaseConnectionToPool(client);
      }
      return result;
    } catch (error) {
      // On error, mark client as unhealthy and don't return to pool
      if (client) {
        client.isHealthy = false;
        await client.quit().catch(() => {});
        connectionMetrics.activeConnections--;
        poolStats.totalDestroyed++;
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
  pool: {
    size: redisClientsPool.length,
    minSize: MIN_POOL_SIZE,
    maxSize: MAX_POOL_SIZE,
    hitRate: connectionMetrics.poolHits + connectionMetrics.poolMisses > 0
      ? (connectionMetrics.poolHits / (connectionMetrics.poolHits + connectionMetrics.poolMisses) * 100).toFixed(2) + '%'
      : 'N/A',
    stats: { ...poolStats }
  },
  connectionString: REDIS_URL.replace(/:([^:]+)@/, ':***@'), // Hide password in logs
  lastConnectionTime: new Date(connectionMetrics.lastConnectionTime).toISOString(),
  uptime: connectionMetrics.lastConnectionTime ? 
    Math.floor((Date.now() - connectionMetrics.lastConnectionTime) / 1000) + 's' : 'N/A',
  circuitBreaker: redisCircuitBreaker.getMetrics(),
  cacheMetrics: globalCacheMetrics.getMetrics(),
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