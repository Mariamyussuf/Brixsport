import * as Redis from 'redis';
import { logger } from '../utils/logger';

// Type definitions for Redis v4.7.1
type RedisClient = ReturnType<typeof Redis.createClient>;
interface RedisClientOptions {
  host?: string;
  port?: number;
  url?: string;
  retry_strategy?: (options: any) => Error | number | undefined;
  [key: string]: any;
}

type MessageHandler = (channel: string, message: string) => void;

export class RedisPubSub {
  private static instance: RedisPubSub;
  private publisher: RedisClient | null = null;
  private subscriber: RedisClient | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isSubscribed = false;
  private subscriptionMap: Map<string, number> = new Map(); // Track channel subscriptions
  private isInitializing = false;
  
  // Redis client options
  private redisOptions: RedisClientOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retry_strategy: (options: any) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        logger.error('Redis server refused the connection');
        return new Error('The server refused the connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        logger.error('Retry time exhausted');
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        logger.error('Max Redis reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(options.attempt * 100, 5000);
    }
  };

  private constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitializing) return;
    this.isInitializing = true;
    
    try {
      // In Redis v4, createClient automatically connects
      this.publisher = Redis.createClient(this.redisOptions);
      this.subscriber = Redis.createClient(this.redisOptions);
      
      // Wait for both clients to be ready
      await new Promise<void>((resolve, reject) => {
        const checkReady = () => {
          if (this.publisher?.isReady && this.subscriber?.isReady) {
            resolve();
          } else if (!this.publisher || !this.subscriber) {
            reject(new Error('Failed to create Redis clients'));
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
      
      await this.initializeSubscriber();
    } catch (error) {
      logger.error('Failed to initialize RedisPubSub:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  public static getInstance(): RedisPubSub {
    if (!RedisPubSub.instance) {
      RedisPubSub.instance = new RedisPubSub();
    }
    return RedisPubSub.instance;
  }

  private async initializeSubscriber() {
    if (!this.subscriber) {
      throw new Error('Redis subscriber client not initialized');
    }

    try {
      this.isSubscribed = true;
      
      // Message handler for direct channel subscriptions
      const messageHandler = (channel: string, message: string) => {
        this.handleMessage(channel, message);
      };
      
      // Pattern message handler
      const pMessageHandler = (pattern: string, channel: string, message: string) => {
        this.handleMessage(channel, message);
      };
      
      // Subscribe to message events
      this.subscriber.on('message', messageHandler);
      this.subscriber.on('pmessage', pMessageHandler);
      
      // Handle errors
      this.subscriber.on('error', (err: Error) => {
        logger.error('Redis subscriber error:', err);
      });
      
      logger.info('Redis Pub/Sub subscriber initialized');
      this.isInitializing = false;
      
      // Return cleanup function
      return () => {
        // In Redis v4, we use removeListener instead of off
        this.subscriber?.removeListener('message', messageHandler);
        this.subscriber?.removeListener('pmessage', pMessageHandler);
      };
    } catch (error) {
      this.isSubscribed = false;
      this.isInitializing = false;
      logger.error('Failed to initialize Redis Pub/Sub:', error);
      throw error;
    }
  }

  private handleMessage(channel: string, message: string) {
    try {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.forEach(handler => handler(channel, message));
      }
      
      // Also check for pattern subscriptions
      this.handlers.forEach((handlers, pattern) => {
        if (this.isPatternMatch(pattern, channel)) {
          handlers.forEach(handler => handler(channel, message));
        }
      });
    } catch (error) {
      logger.error('Error handling Redis message:', { channel, error });
    }
  }

  private isPatternMatch(pattern: string, channel: string): boolean {
    if (pattern === channel) return true;
    if (!pattern.includes('*')) return false;
    
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
      
    return new RegExp(`^${regexPattern}$`).test(channel);
  }

  public async publish(channel: string, message: any): Promise<number> {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized');
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      const result = await this.publisher.publish(channel, messageStr);
      return result;
    } catch (error) {
      logger.error('Error publishing message to Redis:', { channel, error });
      throw error;
    }
  }

  public async subscribe(channel: string, handler: MessageHandler): Promise<() => Promise<void>> {
    if (!this.isSubscribed || !this.subscriber) {
      throw new Error('Redis subscriber not available');
    }

    try {
      // Track subscription count
      const count = (this.subscriptionMap.get(channel) || 0) + 1;
      this.subscriptionMap.set(channel, count);

      // Only subscribe if this is the first handler for this channel
      if (count === 1) {
        await new Promise<void>((resolve, reject) => {
          // @ts-ignore - The type definitions are incorrect for the callback
          this.subscriber?.subscribe(channel, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Add handler
      if (!this.handlers.has(channel)) {
        this.handlers.set(channel, new Set());
      }
      this.handlers.get(channel)?.add(handler);
      
      // Return unsubscribe function
      return async () => {
        await this.unsubscribe(channel, handler);
      };
    } catch (error) {
      logger.error('Error subscribing to Redis channel:', { channel, error });
      throw error;
    }
  }

  public async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    if (!this.isSubscribed || !this.subscriber) return;

    try {
      const channelHandlers = this.handlers.get(channel);
      if (!channelHandlers) return;

      if (handler) {
        channelHandlers.delete(handler);
      } else {
        channelHandlers.clear();
      }

      // Update subscription count
      const count = (this.subscriptionMap.get(channel) || 0) - 1;
      
      if (count <= 0) {
        // No more handlers, unsubscribe from channel
        await this.subscriber.unsubscribe(channel);
        this.subscriptionMap.delete(channel);
        this.handlers.delete(channel);
      } else {
        this.subscriptionMap.set(channel, count);
      }
    } catch (error) {
      logger.error('Error unsubscribing from Redis channel:', { channel, error });
    }
  }

  public async psubscribe(pattern: string, handler: MessageHandler): Promise<() => Promise<void>> {
    if (!this.isSubscribed || !this.subscriber) {
      throw new Error('Redis subscriber not available');
    }

    try {
      // In Redis v4, pSubscribe uses a callback
      await new Promise<void>((resolve, reject) => {
        // @ts-ignore - The Redis types might not be fully accurate
        this.subscriber?.pSubscribe(pattern, (err: Error | null) => {
          if (err) {
            logger.error('Error subscribing to Redis pattern:', { pattern, error: err });
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Set up the message handler for this pattern
      this.subscriber.on('pmessage', (msgPattern: string, channel: string, message: string) => {
        if (this.isPatternMatch(msgPattern, channel)) {
          this.handleMessage(channel, message);
        }
      });

      if (!this.handlers.has(pattern)) {
        this.handlers.set(pattern, new Set());
      }
      this.handlers.get(pattern)?.add(handler);
      
      // Return unsubscribe function
      return async () => {
        await this.punsubscribe(pattern, handler);
      };
    } catch (error) {
      logger.error('Error subscribing to Redis pattern:', { pattern, error });
      throw error;
    }
  }

  public async punsubscribe(pattern: string, handler?: MessageHandler): Promise<void> {
    if (!this.isSubscribed || !this.subscriber) return;

    try {
      const patternHandlers = this.handlers.get(pattern);
      if (!patternHandlers) return;

      if (handler) {
        patternHandlers.delete(handler);
      } else {
        patternHandlers.clear();
      }

      if (!handler || patternHandlers.size === 0) {
        await this.subscriber.pUnsubscribe(pattern, (message: string, channel: string) => {
        // Handle unsubscription if needed
      });
        this.handlers.delete(pattern);
      }
    } catch (error) {
      logger.error('Error unsubscribing from Redis pattern:', { pattern, error });
    }
  }

  private async getSubscriberCount(channel: string): Promise<number> {
    if (!this.publisher) {
      throw new Error('Redis publisher not available');
    }
    
    try {
      // In Redis v4, we use the PUBSUB command
      const result = await this.publisher.sendCommand(['PUBSUB', 'NUMSUB', channel]) as [string, number];
      // Result is [channel, count, ...]
      return Array.isArray(result) && result.length >= 2 ? result[1] : 0;
    } catch (error) {
      logger.error('Error getting subscriber count:', { channel, error });
      throw error;
    }
  }

  public async getChannels(pattern: string = '*'): Promise<string[]> {
    if (!this.publisher) return [];
    
    try {
      // In Redis v4, we use the PUBSUB command
      const result = await this.publisher.sendCommand(['PUBSUB', 'CHANNELS', pattern]);
      return Array.isArray(result) ? result.map(String) : [];
    } catch (error) {
      logger.error('Error getting channels:', { pattern, error });
      return [];
    }
  }

  public async close(): Promise<void> {
    try {
      // In Redis v4, we use the quit method which returns a promise
      const quitPromises = [];
      
      if (this.publisher) {
        quitPromises.push(this.publisher.quit());
      }
      
      if (this.subscriber) {
        quitPromises.push(this.subscriber.quit());
      }
      
      await Promise.all(quitPromises);
    } catch (error) {
      logger.error('Error closing Redis clients:', error);
      throw error;
    } finally {
      this.publisher = null;
      this.subscriber = null;
      this.isSubscribed = false;
      this.isInitializing = false;
    }
  }
}

export const redisPubSub = RedisPubSub.getInstance();
