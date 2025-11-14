import { getOptionalRedisClient } from '../config/redis';
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
  getList(key: string): Promise<string[]>;
}

export const redisService: RedisService = {
  // String operations
  set: async (key: string, value: string, expireInSeconds?: number): Promise<void> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping SET operation', { key });
        return;
      }
      
      if (expireInSeconds) {
        await client.set(key, value, { EX: expireInSeconds });
      } else {
        await client.set(key, value);
      }
      
      logger.debug('Redis SET operation completed', { key, expireInSeconds });
    } catch (error: any) {
      logger.error('Redis SET operation failed', { key, error: error.message });
    }
  },
  
  get: async (key: string): Promise<string | null> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping GET operation', { key });
        return null;
      }
      
      const value = await client.get(key);
      logger.debug('Redis GET operation completed', { key, hasValue: !!value });
      return value || null;
    } catch (error: any) {
      logger.error('Redis GET operation failed', { key, error: error.message });
      return null;
    }
  },
  
  del: async (key: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping DEL operation', { key });
        return 0;
      }
      
      const result = await client.del(key);
      logger.debug('Redis DEL operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis DEL operation failed', { key, error: error.message });
      return 0;
    }
  },
  
  // Add incr method implementation
  incr: async (key: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping INCR operation', { key });
        return 0;
      }
      
      const result = await client.incr(key);
      logger.debug('Redis INCR operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis INCR operation failed', { key, error: error.message });
      return 0;
    }
  },
  
  // Hash operations
  hset: async (key: string, field: string, value: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping HSET operation', { key, field });
        return 0;
      }
      
      const result = await client.hSet(key, field, value);
      logger.debug('Redis HSET operation completed', { key, field });
      return result;
    } catch (error: any) {
      logger.error('Redis HSET operation failed', { key, field, error: error.message });
      return 0;
    }
  },
  
  hget: async (key: string, field: string): Promise<string | null> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping HGET operation', { key, field });
        return null;
      }
      
      const value = await client.hGet(key, field);
      logger.debug('Redis HGET operation completed', { key, field, hasValue: !!value });
      return value || null;
    } catch (error: any) {
      logger.error('Redis HGET operation failed', { key, field, error: error.message });
      return null;
    }
  },
  
  hgetall: async (key: string): Promise<Record<string, string>> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping HGETALL operation', { key });
        return {};
      }
      
      const value = await client.hGetAll(key);
      logger.debug('Redis HGETALL operation completed', { key, fieldCount: Object.keys(value).length });
      return value;
    } catch (error: any) {
      logger.error('Redis HGETALL operation failed', { key, error: error.message });
      return {};
    }
  },
  
  hdel: async (key: string, ...fields: string[]): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping HDEL operation', { key, fields });
        return 0;
      }
      
      const result = await client.hDel(key, fields);
      logger.debug('Redis HDEL operation completed', { key, fieldCount: fields.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis HDEL operation failed', { key, fields, error: error.message });
      return 0;
    }
  },
  
  // Set operations
  sadd: async (key: string, ...members: string[]): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping SADD operation', { key, members });
        return 0;
      }
      
      const result = await client.sAdd(key, members);
      logger.debug('Redis SADD operation completed', { key, memberCount: members.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis SADD operation failed', { key, members, error: error.message });
      return 0;
    }
  },
  
  srem: async (key: string, ...members: string[]): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping SREM operation', { key, members });
        return 0;
      }
      
      const result = await client.sRem(key, members);
      logger.debug('Redis SREM operation completed', { key, memberCount: members.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis SREM operation failed', { key, members, error: error.message });
      return 0;
    }
  },
  
  smembers: async (key: string): Promise<string[]> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping SMEMBERS operation', { key });
        return [];
      }
      
      const result = await client.sMembers(key);
      logger.debug('Redis SMEMBERS operation completed', { key, memberCount: result.length });
      return result;
    } catch (error: any) {
      logger.error('Redis SMEMBERS operation failed', { key, error: error.message });
      return [];
    }
  },
  
  sismember: async (key: string, member: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping SISMEMBER operation', { key, member });
        return 0;
      }
      
      const result = await client.sIsMember(key, member);
      logger.debug('Redis SISMEMBER operation completed', { key, member, result });
      return result ? 1 : 0;
    } catch (error: any) {
      logger.error('Redis SISMEMBER operation failed', { key, member, error: error.message });
      return 0;
    }
  },
  
  // List operations
  lpush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping LPUSH operation', { key, values });
        return 0;
      }
      
      const result = await client.lPush(key, values);
      logger.debug('Redis LPUSH operation completed', { key, valueCount: values.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis LPUSH operation failed', { key, values, error: error.message });
      return 0;
    }
  },
  
  rpush: async (key: string, ...values: string[]): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping RPUSH operation', { key, values });
        return 0;
      }
      
      const result = await client.rPush(key, values);
      logger.debug('Redis RPUSH operation completed', { key, valueCount: values.length, result });
      return result;
    } catch (error: any) {
      logger.error('Redis RPUSH operation failed', { key, values, error: error.message });
      return 0;
    }
  },
  
  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping LRANGE operation', { key, start, stop });
        return [];
      }
      
      const result = await client.lRange(key, start, stop);
      logger.debug('Redis LRANGE operation completed', { key, start, stop, resultCount: result.length });
      return result;
    } catch (error: any) {
      logger.error('Redis LRANGE operation failed', { key, start, stop, error: error.message });
      return [];
    }
  },
  
  lrem: async (key: string, count: number, value: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping LREM operation', { key, count, value });
        return 0;
      }
      
      const result = await client.lRem(key, count, value);
      logger.debug('Redis LREM operation completed', { key, count, value, result });
      return result;
    } catch (error: any) {
      logger.error('Redis LREM operation failed', { key, count, value, error: error.message });
      return 0;
    }
  },
  
  ltrim: async (key: string, start: number, stop: number): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping LTRIM operation', { key, start, stop });
        return 0;
      }
      
      await client.lTrim(key, start, stop);
      logger.debug('Redis LTRIM operation completed', { key, start, stop });
      return 1; // Return 1 to indicate success
    } catch (error: any) {
      logger.error('Redis LTRIM operation failed', { key, start, stop, error: error.message });
      return 0;
    }
  },
  
  // Expiration
  expire: async (key: string, seconds: number): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping EXPIRE operation', { key, seconds });
        return 0;
      }
      
      const result = await client.expire(key, seconds);
      logger.debug('Redis EXPIRE operation completed', { key, seconds, result });
      return result ? 1 : 0; // Convert boolean to number
    } catch (error: any) {
      logger.error('Redis EXPIRE operation failed', { key, seconds, error: error.message });
      return 0;
    }
  },
  
  ttl: async (key: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping TTL operation', { key });
        return -2; // Key doesn't exist
      }
      
      const result = await client.ttl(key);
      logger.debug('Redis TTL operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis TTL operation failed', { key, error: error.message });
      return -2; // Key doesn't exist
    }
  },
  
  // Key existence
  exists: async (key: string): Promise<number> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping EXISTS operation', { key });
        return 0;
      }
      
      const result = await client.exists(key);
      logger.debug('Redis EXISTS operation completed', { key, result });
      return result;
    } catch (error: any) {
      logger.error('Redis EXISTS operation failed', { key, error: error.message });
      return 0;
    }
  },
  
  // Pattern operations
  keys: async (pattern: string): Promise<string[]> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping KEYS operation', { pattern });
        return [];
      }
      
      const result = await client.keys(pattern);
      logger.debug('Redis KEYS operation completed', { pattern, resultCount: result.length });
      return result;
    } catch (error: any) {
      logger.error('Redis KEYS operation failed', { pattern, error: error.message });
      return [];
    }
  },
  
  flushdb: async (): Promise<void> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping FLUSHDB operation');
        return;
      }
      
      await client.flushDb();
      logger.debug('Redis FLUSHDB operation completed');
    } catch (error: any) {
      logger.error('Redis FLUSHDB operation failed', { error: error.message });
    }
  },
  
  getList: async (key: string): Promise<string[]> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        logger.debug('Redis not available, skipping getList operation', { key });
        return [];
      }
      
      const result = await client.lRange(key, 0, -1);
      logger.debug('Redis getList operation completed', { key, resultCount: result.length });
      return result;
    } catch (error: any) {
      logger.error('Redis getList operation failed', { key, error: error.message });
      return [];
    }
  }
};