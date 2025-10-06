import { withRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Buffer } from 'buffer';
import { promisify } from 'util';

// Promisify the randomBytes function
const randomBytesAsync = promisify<number, Buffer>(randomBytes);

// Helper function to safely parse JSON
function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    return null;
  }
}

export interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  userAgent?: string;
  ipAddress?: string;
  csrfToken?: string; // CSRF token for form submissions
  [key: string]: any; // Allow additional session data
}

export interface SessionOptions {
  ttl?: number; // Session time to live in seconds
  refreshOnAccess?: boolean; // Whether to extend TTL on each access
  prefix?: string; // Redis key prefix
  rotate?: boolean; // Whether to rotate session ID on critical operations
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
  };
}

export interface Session {
  id: string;
  data: SessionData;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  version: string; // Session schema version for migrations
}

export interface SessionResult {
  success: boolean;
  session?: Session;
  error?: string;
  csrfToken?: string; // Only populated for create and refresh operations
}

export interface SessionListResult {
  success: boolean;
  sessions: Session[];
  total: number;
  cursor?: string; // For pagination
  error?: string;
}

// Extended session with additional metadata for admin purposes
export interface ExtendedSession extends Session {
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  geoInfo?: {
    country?: string;
    region?: string;
    city?: string;
  };
  securityInfo?: {
    isSecure: boolean;
    isTorExitNode?: boolean;
    isVpn?: boolean;
    isProxy?: boolean;
    threatScore?: number;
  };
}

export class RedisSessionService {
  private static readonly DEFAULT_TTL = 60 * 60 * 24 * 7; // 7 days
  private static readonly SESSION_PREFIX = 'brixsport:sessions:';
  private static readonly USER_SESSIONS_PREFIX = 'brixsport:user_sessions:';
  private static readonly SESSION_INDEX = 'brixsport:sessions_index';
  private static readonly CSRF_TOKENS_PREFIX = 'brixsport:csrf_tokens:';
  private static readonly REVOKED_SESSIONS = 'brixsport:revoked_sessions';
  private static readonly SESSION_VERSION = '1.0.0';
  private static readonly MAX_SESSIONS_PER_USER = 10;
  private static readonly DEFAULT_CSRF_TTL = 60 * 60 * 24; // 24 hours
  private static readonly DEFAULT_PREFIX = RedisSessionService.SESSION_PREFIX;

  /**
   * Generate a cryptographically secure session ID
   */
  private static async generateSessionId(): Promise<string> {
    const buffer = await randomBytesAsync(32);
    const timestamp = Date.now().toString(16);
    return `sess_${timestamp}_${buffer.toString('hex')}`;
  }

  /**
   * Generate a CSRF token and store it in Redis
   */
  public static async getCsrfToken(sessionId: string): Promise<string> {
    try {
      return await withRedis(async (client) => {
        const token = (await randomBytesAsync(32)).toString('hex');
        const tokenKey = `${this.CSRF_TOKENS_PREFIX}${sessionId}`;
        await client.set(
          tokenKey,
          token,
          { EX: this.DEFAULT_CSRF_TTL }
        );
        return token;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating CSRF token:', { 
        sessionId, 
        error: errorMessage 
      });
      throw new Error('Failed to generate CSRF token');
    }
  }

  /**
   * Hash a token for secure storage
   */
  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get the Redis key for a session
   */
  private static getSessionKey(sessionId: string, prefix: string = this.SESSION_PREFIX): string {
    return `${prefix}${sessionId}`;
  }

  /**
   * Get the Redis key for a user's sessions set
   */
  private static getUserSessionsKey(userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}${userId}`;
  }

  /**
   * Create a new session
   */
  public static async create(
    data: SessionData,
    options: SessionOptions = {}
  ): Promise<SessionResult> {
    const {
      ttl = this.DEFAULT_TTL,
      refreshOnAccess = true,
      prefix = this.SESSION_PREFIX,
      rotate = true,
      cookieOptions = {}
    } = options;
    
    try {
      // Generate a new session ID
      const sessionId = await this.generateSessionId();
      const now = Date.now();
      const expiresAt = now + ttl * 1000;
      
      // Generate CSRF token
      const csrfToken = await this.getCsrfToken(sessionId);
      
      // Create session object
      const session: Session = {
        id: sessionId,
        data: { 
          ...data,
          csrfToken: this.hashToken(csrfToken) // Store hashed token in session
        },
        createdAt: now,
        expiresAt,
        lastAccessedAt: now,
        userAgent: data.userAgent || '',
        ipAddress: data.ipAddress || '',
        isRevoked: false,
        version: this.SESSION_VERSION
      };
      
      // Enforce maximum sessions per user
      if (await this.getUserSessionCount(data.userId) >= this.MAX_SESSIONS_PER_USER) {
        await this.cleanupOldestUserSessions(data.userId, 1);
      }
      
      // Use transaction for atomic operations
      await withRedis(async (client) => {
        const sessionKey = this.getSessionKey(sessionId, prefix);
        const userSessionsKey = this.getUserSessionsKey(data.userId);
        
        const multi = client.multi();
        
        // Store session data
        multi.set(
          sessionKey,
          JSON.stringify(session),
          { PX: ttl * 1000, NX: true }
        );
        
        // Add to user's sessions set
        multi.sAdd(userSessionsKey, sessionId);
        multi.expire(userSessionsKey, ttl);
        
        // Add to session index (for admin purposes)
        multi.zAdd(this.SESSION_INDEX, { 
          score: now, 
          value: sessionId 
        });
        
        // Execute transaction
        await multi.exec();
      });
      
      logger.info('Session created', { 
        sessionId, 
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      });
      
      return { 
        success: true, 
        session: {
          ...session,
          data: {
            ...session.data,
            csrfToken // Return plain token to client (only time it's exposed)
          }
        },
        csrfToken // Also return CSRF token separately for convenience
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Session creation error:', { 
        error: errorMessage,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress
      });
      
      return { 
        success: false, 
        error: 'Failed to create session',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage })
      };
    }
  }
  
  /**
   * Get the number of active sessions for a user
   */
  private static async getUserSessionCount(userId: string): Promise<number> {
    try {
      return await withRedis(async (client) => {
        const userSessionsKey = this.getUserSessionsKey(userId);
        return await client.sCard(userSessionsKey);
      });
    } catch (error) {
      logger.error('Error getting user session count:', { userId, error });
      return 0;
    }
  }
  
  /**
   * Clean up oldest sessions for a user
   */
  private static async cleanupOldestUserSessions(userId: string, count: number = 1): Promise<void> {
    try {
      await withRedis(async (client) => {
        const userSessionsKey = this.getUserSessionsKey(userId);
        const sessions = await client.sMembers(userSessionsKey);
        
        if (sessions.length <= count) return;
        
        // Get session creation times
        const sessionTimes = await Promise.all(
          sessions.map(async (sessionId) => {
            const sessionKey = this.getSessionKey(sessionId);
            const sessionData = await client.get(sessionKey);
            const session = sessionData ? JSON.parse(sessionData) : null;
            return { sessionId, createdAt: session?.createdAt || 0 };
          })
        );
        
        // Sort by creation time (oldest first)
        sessionTimes.sort((a, b) => a.createdAt - b.createdAt);
        
        // Remove oldest sessions
        const sessionsToRemove = sessionTimes.slice(0, count).map(s => s.sessionId);
        
        if (sessionsToRemove.length > 0) {
          const multi = client.multi();
          
          // Remove from user's sessions set
          multi.sRem(userSessionsKey, sessionsToRemove);
          
          // Delete session data
          sessionsToRemove.forEach(sessionId => {
            multi.del(this.getSessionKey(sessionId));
          });
          
          await multi.exec();
          
          logger.info('Cleaned up old user sessions', { 
            userId, 
            removedSessions: sessionsToRemove.length 
          });
        }
      });
    } catch (error) {
      logger.error('Error cleaning up old user sessions:', { userId, error });
    }
  }

  /**
   * Get a session
   */
  public static async get(
    sessionId: string,
    options: SessionOptions = {}
  ): Promise<SessionResult> {
    const {
      refreshOnAccess = true,
      ttl = this.DEFAULT_TTL,
      prefix = this.DEFAULT_PREFIX
    } = options;
    
    try {
      return await withRedis(async (client) => {
        const sessionKey = this.getSessionKey(sessionId, prefix);
        const sessionData = await client.get(sessionKey);
        
        if (!sessionData) {
          return { 
            success: false, 
            error: 'Session not found or expired' 
          };
        }
        
        const session = JSON.parse(sessionData) as Session;
        
        // Check if session is revoked
        if (session.isRevoked) {
          return { 
            success: false, 
            error: 'Session has been revoked' 
          };
        }
        
        // Check if session is expired
        if (Date.now() > session.expiresAt) {
          await this.delete(sessionId, { prefix });
          return { 
            success: false, 
            error: 'Session has expired' 
          };
        }
        
        // Update last accessed time if needed
        if (refreshOnAccess) {
          session.lastAccessedAt = Date.now();
          
          // Extend TTL
          await client.setEx(
            sessionKey,
            ttl,
            JSON.stringify(session)
          );
        }
        
        return { success: true, session };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Session get error:', { sessionId, error: errorMessage });
      return { 
        success: false, 
        error: 'Failed to retrieve session' 
      };
    }
  }

  /**
   * Update a session
   */
  public static async update(
    sessionId: string,
    data: SessionData,
    options: SessionOptions = {}
  ): Promise<SessionResult> {
    const {
      refreshOnAccess = true,
      ttl = this.DEFAULT_TTL,
      prefix = this.DEFAULT_PREFIX
    } = options;
    
    try {
      return await withRedis(async (client) => {
        const sessionKey = this.getSessionKey(sessionId, prefix);
        const sessionData = await client.get(sessionKey);
        
        if (!sessionData) {
          return { 
            success: false, 
            error: 'Session not found' 
          };
        }
        
        const session = JSON.parse(sessionData) as Session;
        
        // Check if session is revoked or expired
        if (session.isRevoked) {
          return { 
            success: false, 
            error: 'Session has been revoked' 
          };
        }
        
        if (Date.now() > session.expiresAt) {
          await this.delete(sessionId, { prefix });
          return { 
            success: false, 
            error: 'Session has expired' 
          };
        }
        
        // Update session with new expiry
        const now = Date.now();
        const updatedSession: Session = {
          ...session,
          lastAccessedAt: now,
          expiresAt: now + ttl * 1000,
          data: { ...session.data, ...data }
        };
        
        // Update session in Redis
        await client.set(
          sessionKey,
          JSON.stringify(updatedSession),
          { PX: ttl * 1000 }
        );
        
        // Generate new CSRF token
        const csrfToken = await this.generateCsrfToken(sessionId);
        
        logger.info('Session updated', { 
          sessionId,
          userId: session.data.userId 
        });
        
        return { 
          success: true, 
          session: updatedSession,
          csrfToken
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating session:', { 
        sessionId, 
        error: errorMessage 
      });
      
      return { 
        success: false, 
        error: 'Failed to update session',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage })
      };
    }
  }

  /**
   * Delete a session
   */
  public static async delete(
    sessionId: string,
    options: SessionOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    const { prefix = this.DEFAULT_PREFIX } = options;
    
    try {
      return await withRedis(async (client) => {
        const sessionKey = this.getSessionKey(sessionId, prefix);
        const sessionData = await client.get(sessionKey);
        
        if (sessionData) {
          const session = JSON.parse(sessionData) as Session;
          const userSessionsKey = this.getUserSessionsKey(session.data.userId);
          
          // Start a transaction
          const multi = client.multi();
          
          // Delete session
          multi.del(sessionKey);
          
          // Remove from user's sessions
          multi.sRem(userSessionsKey, sessionId);
          
          // Remove from session index
          multi.zRem(this.SESSION_INDEX, sessionId);
          
          await multi.exec();
        }
        
        return { success: true };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Session delete error:', { sessionId, error: errorMessage });
      return { 
        success: false, 
        error: 'Failed to delete session' 
      };
    }
  }

  /**
   * Revoke a session (mark as revoked but keep in storage)
   */
  public static async revoke(
    sessionId: string,
    options: SessionOptions = {}
  ): Promise<SessionResult> {
    const { prefix = this.DEFAULT_PREFIX } = options;
    
    try {
      return await withRedis(async (client) => {
        const sessionKey = this.getSessionKey(sessionId, prefix);
        const sessionData = await client.get(sessionKey);
        
        if (!sessionData) {
          return { 
            success: false, 
            error: 'Session not found' 
          };
        }
        
        const session = JSON.parse(sessionData) as Session;
        session.isRevoked = true;
        session.expiresAt = Date.now(); // Expire immediately
        
        await client.set(
          sessionKey,
          JSON.stringify(session),
          { PX: 60 * 60 * 1000 } // Keep revoked session for 1 hour
        );
        
        return { success: true, session };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Session revoke error:', { sessionId, error: errorMessage });
      return { 
        success: false, 
        error: 'Failed to revoke session' 
      };
    }
  }
  
  /**
   * List all sessions for a user
   */
  public static async listUserSessions(
    userId: string,
    options: SessionOptions = {}
  ): Promise<SessionListResult> {
    const { prefix = this.DEFAULT_PREFIX } = options;
    
    try {
      return await withRedis(async (client) => {
        const userSessionsKey = this.getUserSessionsKey(userId);
        const sessionIds = await client.sMembers(userSessionsKey);
        
        if (sessionIds.length === 0) {
          return { success: true, sessions: [], total: 0 };
        }
        
        // Get all sessions in parallel
        const sessionPromises = sessionIds.map(sessionId => 
          this.get(sessionId, { ...options, refreshOnAccess: false })
        );
        
        const results = await Promise.all(sessionPromises);
        const sessions = results
          .filter(result => result.success && result.session)
          .map(result => result.session!);
        
        // Clean up any invalid session references
        if (sessions.length < sessionIds.length) {
          const validSessionIds = new Set(sessions.map(s => s.id));
          const invalidSessionIds = sessionIds.filter(id => !validSessionIds.has(id));
          
          if (invalidSessionIds.length > 0) {
            if (invalidSessionIds.length > 0) {
              await client.sRem(userSessionsKey, invalidSessionIds);
            }
          }
        }
        
        return { 
          success: true, 
          sessions, 
          total: sessions.length 
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('List user sessions error:', { userId, error: errorMessage });
      return { 
        success: false, 
        sessions: [], 
        total: 0, 
        error: 'Failed to list user sessions' 
      };
    }
  }
  
  /**
   * Revoke all sessions for a user (except the current one if provided)
   */
  public static async revokeAllUserSessions(
    userId: string,
    options: { 
      prefix?: string;
      excludeSessionId?: string;
    } = {}
  ): Promise<{ success: boolean; revoked: number; error?: string }> {
    const { prefix = this.DEFAULT_PREFIX, excludeSessionId } = options;
    
    try {
      return await withRedis(async (client) => {
        const userSessionsKey = this.getUserSessionsKey(userId);
        const sessionIds = await client.sMembers(userSessionsKey);
        
        if (sessionIds.length === 0) {
          return { success: true, revoked: 0 };
        }
        
        let revokedCount = 0;
        const revokePromises = [];
        
        for (const sessionId of sessionIds) {
          if (sessionId === excludeSessionId) {
            continue; // Skip current session if specified
          }
          
          const sessionKey = this.getSessionKey(sessionId, prefix);
          const sessionData = await client.get(sessionKey);
          
          if (sessionData) {
            const session = JSON.parse(sessionData) as Session;
            session.isRevoked = true;
            session.expiresAt = Date.now();
            
            revokePromises.push(
              client.set(
                sessionKey,
                JSON.stringify(session),
                { PX: 60 * 60 * 1000 } // Keep revoked session for 1 hour
              )
            );
            
            // Remove from session index
            revokePromises.push(
              client.zRem(this.SESSION_INDEX, sessionId)
            );
            
            revokedCount++;
          }
          
          // Remove from user's sessions set
          revokePromises.push(
            client.sRem(userSessionsKey, sessionId)
          );
        }
        
        await Promise.all(revokePromises);
        
        return { success: true, revoked: revokedCount };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Revoke all user sessions error:', { userId, error: errorMessage });
      return { 
        success: false, 
        revoked: 0, 
        error: 'Failed to revoke user sessions' 
      };
    }
  }
  
  /**
   * Clean up expired sessions
   */
  public static async cleanupExpiredSessions(
    options: { batchSize?: number } = {}
  ): Promise<{ success: boolean; cleaned: number; error?: string }> {
    const { batchSize = 1000 } = options;
    const now = Date.now();
    
    try {
      return await withRedis(async (client) => {
        // Find expired session IDs using the sorted set
        const expiredSessionIds = await client.zRangeByScore(
          this.SESSION_INDEX,
          0,
          now,
          { LIMIT: { offset: 0, count: batchSize } }
        );
        
        if (expiredSessionIds.length === 0) {
          return { success: true, cleaned: 0 };
        }
        
        // Get session data in batches
        const sessionKeys = expiredSessionIds.map(id => this.getSessionKey(id));
        const sessionData = await Promise.all(
          sessionKeys.map(key => client.get(key))
        );
        
        // Process expired sessions
        const deletePromises = [];
        const userIds = new Set<string>();
        
        for (let i = 0; i < sessionData.length; i++) {
          const data = sessionData[i];
          if (!data) continue;
          
          const session = JSON.parse(data) as Session;
          const sessionId = expiredSessionIds[i];
          
          // Track user ID for cleaning up user_sessions set
          if (session.data?.userId) {
            userIds.add(session.data.userId);
          }
          
          // Delete session
          deletePromises.push(client.del(sessionKeys[i]));
          
          // Remove from session index
          deletePromises.push(
            client.zRem(this.SESSION_INDEX, sessionId)
          );
        }
        
        // Clean up user_sessions sets
        for (const userId of userIds) {
          const userSessionsKey = this.getUserSessionsKey(userId);
          deletePromises.push(
client.sRem(userSessionsKey, expiredSessionIds)
          );
        }
        
        await Promise.all(deletePromises);
        
        return { 
          success: true, 
          cleaned: expiredSessionIds.length 
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Cleanup expired sessions error:', { error: errorMessage });
      return { 
        success: false, 
        cleaned: 0, 
        error: 'Failed to clean up expired sessions' 
      };
    }
  }
  
  /**
   * Generate a secure session ID
   */
  // Note: Removed duplicate generateSessionId method
  
  /**
   * Generate a CSRF token for a session
   */
  public static generateCsrfToken(sessionId: string): string {
    const secret = process.env.SESSION_SECRET || 'default-secret-key';
    return createHash('sha256')
      .update(`${sessionId}:${secret}`)
      .digest('hex');
  }
  
  /**
   * Verify a CSRF token
   */
  public static verifyCsrfToken(
    sessionId: string, 
    token: string
  ): boolean {
    if (!sessionId || !token) return false;
    const expectedToken = this.generateCsrfToken(sessionId);
    try {
      return timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(expectedToken, 'hex')
      );
    } catch (e) {
      logger.error('Error verifying CSRF token:', { error: e });
      return false;
    }
  }
  
}

export const sessionService = RedisSessionService;
