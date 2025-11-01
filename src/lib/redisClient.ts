import { createClient, RedisClientType } from 'redis';

// Redis client configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Create Redis client
let redisClient: RedisClientType | null = null;

// Initialize Redis client
export const initializeRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      password: REDIS_PASSWORD
    });

    // Add error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Add connection event
    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    // Add ready event
    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    throw error;
  }
};

// Get Redis client instance
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    await initializeRedisClient();
  }
  
  if (!redisClient?.isReady) {
    await redisClient?.connect();
  }
  
  return redisClient as RedisClientType;
};

// Close Redis connection
export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default {
  initializeRedisClient,
  getRedisClient,
  closeRedisClient
};