import { initializeRedisClient, getRedisClient, closeRedisClient } from '../redisClient';

describe('Redis Client', () => {
  beforeAll(async () => {
    // Increase timeout for Redis connection
    jest.setTimeout(5000);
  });

  afterAll(async () => {
    // Close Redis connection after tests
    await closeRedisClient();
  });

  it('should initialize Redis client', async () => {
    const client = await initializeRedisClient();
    expect(client).toBeDefined();
    expect(client.isReady).toBe(true);
  });

  it('should get Redis client instance', async () => {
    const client = await getRedisClient();
    expect(client).toBeDefined();
    expect(client.isReady).toBe(true);
  });

  it('should set and get values', async () => {
    const client = await getRedisClient();
    
    // Set a value
    await client.set('test-key', 'test-value');
    
    // Get the value
    const value = await client.get('test-key');
    expect(value).toBe('test-value');
    
    // Delete the key
    await client.del('test-key');
  });

  it('should increment values', async () => {
    const client = await getRedisClient();
    
    // Delete key if it exists
    await client.del('counter');
    
    // Increment the counter
    const value1 = await client.incr('counter');
    expect(value1).toBe(1);
    
    const value2 = await client.incr('counter');
    expect(value2).toBe(2);
    
    // Delete the key
    await client.del('counter');
  });
});