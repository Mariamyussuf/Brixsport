import { logger } from '../../utils/logger';
import { redisService } from '../redis.service';

export interface RefreshTokenSession {
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export const refreshTokenService = {
  async createSession(refreshToken: string, sessionData: RefreshTokenSession, ttl: number): Promise<void> {
    const sessionKey = `refreshToken:${refreshToken}`;
    await redisService.set(sessionKey, JSON.stringify(sessionData), ttl);
    logger.info('Refresh token session stored', { refreshToken });
  },

  async getSession(refreshToken: string): Promise<RefreshTokenSession | null> {
    const sessionKey = `refreshToken:${refreshToken}`;
    const sessionStr = await redisService.get(sessionKey);
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  },

  async isSessionExpired(session: RefreshTokenSession): Promise<boolean> {
    return new Date() > session.expiresAt;
  },

  async deleteSession(refreshToken: string, userId: string): Promise<void> {
    const sessionKey = `refreshToken:${refreshToken}`;
    await redisService.del(sessionKey);
    logger.info('Refresh token session deleted', { refreshToken });
  },

  async deleteAllUserSessions(userId: string): Promise<void> {
    // This is inefficient without a secondary index, but for now we do a scan
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
  }
};
