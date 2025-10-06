import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import searchService from '../services/search.service';
import { SearchQuery } from '../types/search.types';
import { errorHandlerService } from '../services/error.handler.service';

export class SearchController {
  /**
   * Global search across all entities
   * GET /api/search
   */
  async globalSearch(req: Request, res: Response): Promise<Response> {
    try {
      const {
        q,
        entities,
        sort,
        page,
        limit,
        fuzzy,
        sport,
        status,
        location,
        from,
        to
      } = req.query;

      // Validate required query parameter
      if (!q) {
        return res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query (q) is required'
          }
        });
      }

      // Build search query object
      const searchQuery: SearchQuery = {
        q: q as string,
        entities: entities ? (entities as string).split(',') : undefined,
        sort: sort as 'relevance' | 'date' | 'popularity',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        fuzzy: fuzzy === 'true',
        filters: {
          sport: sport ? (sport as string).split(',') : undefined,
          status: status ? (status as string).split(',') : undefined,
          location: location as string,
          dateRange: from || to ? {
            from: from ? new Date(from as string) : undefined,
            to: to ? new Date(to as string) : undefined
          } : undefined
        }
      };

      logger.info('Performing global search', { searchQuery });

      const results = await searchService.globalSearch(searchQuery);

      return res.status(200).json(results);
    } catch (error: any) {
      logger.error('Global search error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Get search suggestions
   * GET /api/search/suggestions
   */
  async getSearchSuggestions(req: Request, res: Response): Promise<Response> {
    try {
      const { q, limit } = req.query;

      // Validate required query parameter
      if (!q) {
        return res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query (q) is required'
          }
        });
      }

      logger.info('Getting search suggestions', { query: q, limit });

      const suggestions = await searchService.getSearchSuggestions(
        q as string,
        limit ? parseInt(limit as string) : undefined
      );

      return res.status(200).json({
        suggestions
      });
    } catch (error: any) {
      logger.error('Get search suggestions error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Get trending search terms
   * GET /api/search/trending
   */
  async getTrendingSearches(req: Request, res: Response): Promise<Response> {
    try {
      const { limit } = req.query;

      logger.info('Getting trending searches', { limit });

      const trending = await searchService.getTrendingSearches(
        limit ? parseInt(limit as string) : undefined
      );

      return res.status(200).json({
        trending
      });
    } catch (error: any) {
      logger.error('Get trending searches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Rebuild search index (admin only)
   * POST /api/search/index
   */
  async rebuildIndex(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Rebuilding search index');

      await searchService.rebuildIndex();

      return res.status(200).json({
        message: 'Search index rebuilt successfully'
      });
    } catch (error: any) {
      logger.error('Rebuild search index error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Rebuild entity-specific search index (admin only)
   * POST /api/search/index/:entity
   */
  async rebuildEntityIndex(req: Request, res: Response): Promise<Response> {
    try {
      const { entity } = req.params;

      logger.info('Rebuilding entity search index', { entity });

      await searchService.rebuildEntityIndex(entity);

      return res.status(200).json({
        message: `Search index for ${entity} rebuilt successfully`
      });
    } catch (error: any) {
      logger.error('Rebuild entity search index error', { error: error.message, stack: error.stack, entity: req.params.entity });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Get search analytics (admin only)
   * GET /api/search/analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Getting search analytics');

      const analytics = await searchService.getAnalytics();

      return res.status(200).json(analytics);
    } catch (error: any) {
      logger.error('Get search analytics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Clear search cache (admin only)
   * DELETE /api/search/cache
   */
  async clearCache(req: Request, res: Response): Promise<Response> {
    try {
      logger.info('Clearing search cache');

      await searchService.clearCache();

      return res.status(200).json({
        success: true,
        message: 'Search cache cleared successfully'
      });
    } catch (error: any) {
      logger.error('Clear search cache error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
}