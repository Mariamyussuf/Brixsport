import { logger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from '../supabase.service';
import { redisService } from '../redis.service';
import { SecuritySession as Session, RefreshTokenSession } from './security-service.types';

export interface SessionService {
  createSession(userId: string, userAgent: string, ip: string): Promise<Session>;
  createRefreshSession(refreshToken: string, sessionData: RefreshTokenSession, ttl: number): Promise<void>;
  getRefreshSession(refreshToken: string): Promise<RefreshTokenSession | null>;
  getSession(sessionId: string): Promise<Session | null>;
  deleteSession(sessionId: string, userId: string): Promise<void>;
  isSessionExpired(session: RefreshTokenSession | Session): boolean;
  deleteRefreshSession(refreshToken: string, userId: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
  validateSession(sessionId: string, userAgent: string, ip: string): Promise<boolean>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
  getUserSessions(userId: string): Promise<Session[]>;
  getActiveSessions(userId: string): Promise<Session[]>;
  updateSessionActivity(sessionId: string): Promise<void>;
}

export const sessionService: SessionService = {
  createSession: async (userId: string, userAgent: string, ip: string): Promise<Session> => {
    try {
      logger.info('Creating session', { userId, ip });
      
      // Generate session ID
      const sessionId = uuidv4();
      
      // Set expiration (7 days)
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Create session object
      const session: Session = {
        id: sessionId,
        userId,
        userAgent,
        ip,
        createdAt,
        lastActivity: createdAt,
        expiresAt
      };
      
      // Store session in Redis with expiration
      const sessionKey = `session:${sessionId}`;
      await redisService.set(sessionKey, JSON.stringify(session), 7 * 24 * 60 * 60); // 7 days
      
      // Also store in database for persistence
      const { error } = await (supabaseService as any).supabase
        .from('user_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          session_token: sessionId, // Using sessionId as session_token
          ip_address: ip,
          user_agent: userAgent,
          created_at: createdAt.toISOString(),
          last_accessed_at: createdAt.toISOString(),
          expires_at: expiresAt.toISOString()
        });
      
      if (error) {
        throw new Error(`Failed to store session in database: ${error.message}`);
      }
      
      // Add session to user's session set in Redis
      await redisService.sadd(`user:sessions:${userId}`, sessionId);
      await redisService.expire(`user:sessions:${userId}`, 7 * 24 * 60 * 60); // 7 days
      
      logger.info('Session created', { sessionId, userId });
      
      return session;
    } catch (error: any) {
      logger.error('Session creation error', error);
      throw error;
    }
  },
  
  createRefreshSession: async (refreshToken: string, sessionData: RefreshTokenSession, ttl: number): Promise<void> => {
    try {
      const sessionKey = `refreshToken:${refreshToken}`;
      await redisService.set(sessionKey, JSON.stringify(sessionData), ttl);
      logger.info('Refresh token session stored', { 
        refreshToken: refreshToken.substring(0, 10) + '...', // Log only part of the token for security
        userId: sessionData.userId,
        ttl
      });
    } catch (error: any) {
      logger.error('Error creating refresh session', { 
        error: error.message,
        stack: error.stack,
        userId: sessionData.userId
      });
      throw error;
    }
  },

  getRefreshSession: async (refreshToken: string): Promise<RefreshTokenSession | null> => {
    const sessionKey = `refreshToken:${refreshToken}`;
    const sessionStr = await redisService.get(sessionKey);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  isSessionExpired: (session: RefreshTokenSession | Session): boolean => {
    return new Date() > new Date(session.expiresAt);
  },

  getSession: async (sessionId: string): Promise<Session | null> => {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await redisService.get(sessionKey);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (error) {
      logger.error('Error getting session', error);
      return null;
    }
  },

  deleteSession: async (sessionId: string, userId: string): Promise<void> => {
    try {
      const sessionKey = `session:${sessionId}`;
      await redisService.del(sessionKey);
      await redisService.srem(`user:sessions:${userId}`, sessionId);
      
      // Also delete from database
      const { error } = await (supabaseService as any).supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) {
        throw new Error(`Failed to delete session from database: ${error.message}`);
      }
      
      logger.info('Session deleted', { sessionId, userId });
    } catch (error) {
      logger.error('Error deleting session', error);
      throw error;
    }
  },

  deleteRefreshSession: async (refreshToken: string, userId: string): Promise<void> => {
    const sessionKey = `refreshToken:${refreshToken}`;
    await redisService.del(sessionKey);
    logger.info('Refresh token session deleted', { refreshToken });
  },

  deleteAllUserSessions: async (userId: string): Promise<void> => {
    const keys = await redisService.keys(`refreshToken:*`);
    for (const key of keys) {
      const sessionStr = await redisService.get(key);
      if (sessionStr) {
        const session: RefreshTokenSession = JSON.parse(sessionStr);
        if (session.userId === userId) {
          await redisService.del(key);
        }
      }
    }
    logger.info('All refresh token sessions deleted for user', { userId });
  },
  
  validateSession: async (sessionId: string, userAgent: string, ip: string): Promise<boolean> => {
    try {
      logger.info('Validating session', { sessionId });
      
      // Try to get session from Redis first
      const sessionKey = `session:${sessionId}`;
      const sessionStr = await redisService.get(sessionKey);
      
      let session: Session | null = null;
      if (sessionStr) {
        session = JSON.parse(sessionStr);
      } else {
        // If not in Redis, try to get from database
        const { data, error } = await (supabaseService as any).supabase
          .from('user_sessions')
          .select('*')
          .eq('session_token', sessionId)
          .single();
        
        if (!error && data) {
          session = {
            id: data.id,
            userId: data.user_id,
            userAgent: data.user_agent,
            ip: data.ip_address,
            createdAt: new Date(data.created_at),
            lastActivity: new Date(data.last_accessed_at),
            expiresAt: new Date(data.expires_at)
          };
          
          // Store in Redis for faster access next time
          await redisService.set(sessionKey, JSON.stringify(session), 7 * 24 * 60 * 60);
        }
      }
      
      if (!session) {
        logger.warn('Session not found', { sessionId });
        return false;
      }
      
      // Check if session is expired
      if (new Date() > session.expiresAt) {
        logger.warn('Session expired', { sessionId });
        await sessionService.revokeSession(sessionId);
        return false;
      }
      
      // Check if IP matches (optional security enhancement)
      if (process.env.STRICT_SESSION_IP_CHECK === 'true' && session.ip !== ip) {
        logger.warn('IP mismatch for session', { sessionId, sessionIp: session.ip, requestIp: ip });
        return false;
      }
      
      // Check if user agent matches (optional security enhancement)
      if (process.env.STRICT_SESSION_UA_CHECK === 'true' && session.userAgent !== userAgent) {
        logger.warn('User agent mismatch for session', { sessionId });
        return false;
      }
      
      logger.info('Session validated', { sessionId });
      return true;
    } catch (error: any) {
      logger.error('Session validation error', error);
      return false;
    }
  },
  
  revokeSession: async (sessionId: string): Promise<void> => {
    try {
      logger.info('Revoking session', { sessionId });
      
      // Remove from Redis
      const sessionKey = `session:${sessionId}`;
      await redisService.del(sessionKey);
      
      // Remove from database
      const { error } = await (supabaseService as any).supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionId);
      
      if (error) {
        logger.warn('Failed to remove session from database', { sessionId, error: error.message });
      }
      
      logger.info('Session revoked', { sessionId });
    } catch (error: any) {
      logger.error('Session revocation error', error);
      throw error;
    }
  },
  
  revokeAllSessions: async (userId: string): Promise<void> => {
    try {
      logger.info('Revoking all sessions for user', { userId });
      
      // Get all session IDs for the user from Redis
      const sessionIds = await redisService.smembers(`user:sessions:${userId}`);
      
      // Remove all sessions from Redis
      for (const sessionId of sessionIds) {
        const sessionKey = `session:${sessionId}`;
        await redisService.del(sessionKey);
      }
      
      // Remove user's session set from Redis
      await redisService.del(`user:sessions:${userId}`);
      
      // Remove all sessions from database
      const { error } = await (supabaseService as any).supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        logger.warn('Failed to remove sessions from database', { userId, error: error.message });
      }
      
      logger.info('All sessions revoked for user', { userId, count: sessionIds.length });
    } catch (error: any) {
      logger.error('Revoke all sessions error', error);
      throw error;
    }
  },
  
  getUserSessions: async (userId: string): Promise<Session[]> => {
    try {
      logger.info('Getting user sessions', { userId });
      
      // Get all session IDs for the user from Redis
      const sessionIds = await redisService.smembers(`user:sessions:${userId}`);
      
      const sessions: Session[] = [];
      // Get each session from Redis
      for (const sessionId of sessionIds) {
        const sessionKey = `session:${sessionId}`;
        const sessionStr = await redisService.get(sessionKey);
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          sessions.push({
            id: session.id,
            userId: session.userId,
            userAgent: session.userAgent,
            ip: session.ip,
            createdAt: new Date(session.createdAt),
            lastActivity: new Date(session.lastActivity),
            expiresAt: new Date(session.expiresAt)
          });
        }
      }
      
      logger.info('User sessions retrieved', { userId, count: sessions.length });
      
      return sessions;
    } catch (error: any) {
      logger.error('Get user sessions error', error);
      throw error;
    }
  },
  
  getActiveSessions: async (userId: string): Promise<Session[]> => {
    // Get all sessions and filter out expired or revoked ones
    const sessions = await sessionService.getUserSessions(userId);
    return sessions.filter(session => 
      !sessionService.isSessionExpired(session) &&
      session.lastActivity > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
    );
  },

  updateSessionActivity: async (sessionId: string): Promise<void> => {
    try {
      logger.debug('Updating session activity', { sessionId });
      
      const sessionKey = `session:${sessionId}`;
      const sessionStr = await redisService.get(sessionKey);
      
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.lastActivity = new Date().toISOString();
        
        // Extend session expiration if configured
        if (process.env.AUTO_EXTEND_SESSION === 'true') {
          const newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + 7); // Extend by 7 days
          session.expiresAt = newExpiresAt.toISOString();
        }
        
        // Update in Redis
        await redisService.set(sessionKey, JSON.stringify(session), 7 * 24 * 60 * 60);
        
        // Update in database
        const { error } = await (supabaseService as any).supabase
          .from('user_sessions')
          .update({
            last_accessed_at: new Date().toISOString(),
            expires_at: session.expiresAt
          })
          .eq('session_token', sessionId);
        
        if (error) {
          logger.warn('Failed to update session in database', { sessionId, error: error.message });
        }
        
        logger.debug('Session activity updated', { sessionId });
      }
    } catch (error: any) {
      logger.error('Session activity update error', error);
      throw error;
    }
  }
};