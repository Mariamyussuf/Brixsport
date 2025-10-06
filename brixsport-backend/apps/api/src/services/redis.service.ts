import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface RedisService {
  // String operations
  set(key: string, value: string, expireInSeconds?: number): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  // Add incr method
  incr(key: string): Promise<number>;
  
  // Hash operations
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  
  // Set operations
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<number>;
  
  // List operations
  lpush(key: string, ...values: string[]): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lrem(key: string, count: number, value: string): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<number>;
  
  // Expiration
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  
  // Key existence
  exists(key: string): Promise<number>;
  
  // Pattern operations
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<void>;
}

export const redisService: RedisService = {
  // String operations
  set: async (key: string, value: string, expireInSeconds?: number): Promise<void> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      if (expireInSeconds) {
        await client.set(key, value, { EX: expireInSeconds });
      } else {
        await client.set(key, value);
      }
      
      logger.debug('Redis SET operation completed', { key, expireInSeconds });
    } catch (error: any) {
      logger.error('Redis SET operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  get: async (key: string): Promise<string | null> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const value = await client.get(key);
      logger.debug('Redis GET operation completed', { key, hasValue: !!value });
      return value || null;
    } catch (error: any) {
      logger.error('Redis GET operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  del: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.del(key);
      logger.debug('Redis DEL operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis DEL operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  // Add incr method implementation
  incr: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.incr(key);
      logger.debug('Redis INCR operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis INCR operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  // Hash operations
  hset: async (key: string, field: string, value: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.hSet(key, field, value);
      logger.debug('Redis HSET operation completed', { key, field });
      return result;
    } catch (error: any) {
      logger.error('Redis HSET operation failed', { key, field, error: error.message });
      throw error;
    }
  },
  
  hget: async (key: string, field: string): Promise<string | null> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const value = await client.hGet(key, field);
      logger.debug('Redis HGET operation completed', { key, field, hasValue: !!value });
      return value || null;
    } catch (error: any) {
      logger.error('Redis HGET operation failed', { key, field, error: error.message });
      throw error;
    }
  },
  
  hgetall: async (key: string): Promise<Record<string, string>> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const value = await client.hGetAll(key);
      logger.debug('Redis HGETALL operation completed', { key, fieldCount: Object.keys(value).length });
      return value;
    } catch (error: any) {
      logger.error('Redis HGETALL operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  hdel: async (key: string, ...fields: string[]): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.hDel(key, fields);
      logger.debug('Redis HDEL operation completed', { key, fieldCount: fields.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis HDEL operation failed', { key, fields, error: error.message });
      throw error;
    }
  },
  
  // Set operations
  sadd: async (key: string, ...members: string[]): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.sAdd(key, members);
      logger.debug('Redis SADD operation completed', { key, memberCount: members.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis SADD operation failed', { key, members, error: error.message });
      throw error;
    }
  },
  
  srem: async (key: string, ...members: string[]): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.sRem(key, members);
      logger.debug('Redis SREM operation completed', { key, memberCount: members.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis SREM operation failed', { key, members, error: error.message });
      throw error;
    }
  },
  
  smembers: async (key: string): Promise<string[]> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const members = await client.sMembers(key);
      logger.debug('Redis SMEMBERS operation completed', { key, memberCount: members.length });
      return members;
    } catch (error: any) {
      logger.error('Redis SMEMBERS operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  sismember: async (key: string, member: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.sIsMember(key, member);
      logger.debug('Redis SISMEMBER operation completed', { key, member, result });
      return result ? 1 : 0;
    } catch (error: any) {
      logger.error('Redis SISMEMBER operation failed', { key, member, error: error.message });
      throw error;
    }
  },
  
  // List operations
  lpush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.lPush(key, values);
      logger.debug('Redis LPUSH operation completed', { key, valueCount: values.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis LPUSH operation failed', { key, values, error: error.message });
      throw error;
    }
  },
  
  rpush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.rPush(key, values);
      logger.debug('Redis RPUSH operation completed', { key, valueCount: values.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis RPUSH operation failed', { key, values, error: error.message });
      throw error;
    }
  },
  
  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const values = await client.lRange(key, start, stop);
      logger.debug('Redis LRANGE operation completed', { key, start, stop, valueCount: values.length });
      return values;
    } catch (error: any) {
      logger.error('Redis LRANGE operation failed', { key, start, stop, error: error.message });
      throw error;
    }
  },
  
  lrem: async (key: string, count: number, value: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.lRem(key, count, value);
      logger.debug('Redis LREM operation completed', { key, count, value, result });
      return result;
    } catch (error: any) {
      logger.error('Redis LREM operation failed', { key, count, value, error: error.message });
      throw error;
    }
  },
  
  ltrim: async (key: string, start: number, stop: number): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      await client.lTrim(key, start, stop);
      logger.debug('Redis LTRIM operation completed', { key, start, stop });
      return 1;
    } catch (error: any) {
      logger.error('Redis LTRIM operation failed', { key, start, stop, error: error.message });
      throw error;
    }
  },
  
  // Expiration
  expire: async (key: string, seconds: number): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.expire(key, seconds);
      logger.debug('Redis EXPIRE operation completed', { key, seconds, result });
      return result ? 1 : 0;
    } catch (error: any) {
      logger.error('Redis EXPIRE operation failed', { key, seconds, error: error.message });
      throw error;
    }
  },
  
  ttl: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.ttl(key);
      logger.debug('Redis TTL operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis TTL operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  // Key existence
  exists: async (key: string): Promise<number> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const result = await client.exists(key);
      logger.debug('Redis EXISTS operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis EXISTS operation failed', { key, error: error.message });
      throw error;
    }
  },
  
  // Pattern operations
  keys: async (pattern: string): Promise<string[]> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      const keys = await client.keys(pattern);
      logger.debug('Redis KEYS operation completed', { pattern, keyCount: keys.length });
      return keys;
    } catch (error: any) {
      logger.error('Redis KEYS operation failed', { pattern, error: error.message });
      throw error;
    }
  },
  
  flushdb: async (): Promise<void> => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not initialized');
      }
      
      await client.flushDb();
      logger.info('Redis FLUSHDB operation completed');
    } catch (error: any) {
      logger.error('Redis FLUSHDB operation failed', { error: error.message });
      throw error;
    }
  }
};