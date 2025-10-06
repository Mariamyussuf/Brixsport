import { Request, Response } from 'express';
import RedisInfoService, { RedisExtendedInfo } from '../services/redis-info.service';
import { logger } from '../utils/logger';

export class RedisInfoController {
  /**
   * Get extended Redis information including metrics and health status
   */
  public static async getExtendedInfo(req: Request, res: Response) {
    try {
      const result = await RedisInfoService.getExtendedRedisInfo();
      
      if (!result.success) {
        logger.error('Failed to get extended Redis info:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to get extended Redis info'
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in RedisInfoController.getExtendedInfo:', error);
      return res.status(500).json({
        success: false,
        error: `Internal server error while fetching extended Redis info: ${errorMessage}`
      });
    }
  }

  /**
   * Get Redis server information
   */
  public static async getInfo(req: Request, res: Response) {
    try {
      const result = await RedisInfoService.getRedisInfo();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to get Redis info'
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error in RedisInfoController.getInfo:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while fetching Redis info'
      });
    }
  }

  /**
   * Get Redis server statistics
   */
  public static async getStats(req: Request, res: Response) {
    try {
      const result = await RedisInfoService.getRedisStats();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to get Redis stats'
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error in RedisInfoController.getStats:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while fetching Redis stats'
      });
    }
  }

  /**
   * Check Redis health
   */
  public static async checkHealth(req: Request, res: Response) {
    try {
      const result = await RedisInfoService.checkHealth();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          status: result.status,
          error: result.error || 'Redis health check failed'
        });
      }

      return res.json({
        success: true,
        status: result.status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in RedisInfoController.checkHealth:', error);
      return res.status(500).json({
        success: false,
        status: 'error',
        error: 'Internal server error while checking Redis health'
      });
    }
  }

  /**
   * Get Redis info for specific sections
   */
  public static async getSections(req: Request, res: Response) {
    try {
      const { sections } = req.query;
      
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Sections parameter is required and must be a non-empty array'
        });
      }

      const result = await RedisInfoService.getRedisInfoSections(sections as string[]);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to get Redis info sections'
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error in RedisInfoController.getSections:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while fetching Redis info sections'
      });
    }
  }
}

export default RedisInfoController;
