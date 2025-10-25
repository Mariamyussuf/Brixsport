import { Request, Response } from 'express';
import contentService, { Article } from '../services/content.service';
import { logger } from '../utils/logger';
import { errorHandlerService } from '../services/error.handler.service';

class ContentController {
  /**
   * Get all published articles
   * GET /api/v1/content/articles
   */
  async getArticles(req: Request, res: Response): Promise<Response> {
    try {
      const { page = '1', limit = '10', category, tag } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PAGE',
            message: 'Page must be a positive integer'
          }
        });
      }
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 100'
          }
        });
      }

      logger.info('Getting articles', { page: pageNum, limit: limitNum, category, tag });

      const result = await contentService.getArticles(pageNum, limitNum, category as string, tag as string);

      return res.status(200).json({
        success: true,
        data: {
          articles: result.articles,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            hasNext: pageNum * limitNum < result.total,
            hasPrev: pageNum > 1
          }
        }
      });
    } catch (error: any) {
      logger.error('Get articles error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Get a single article by slug
   * GET /api/v1/content/articles/:slug
   */
  async getArticleBySlug(req: Request, res: Response): Promise<Response> {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(400).json({
          error: {
            code: 'MISSING_SLUG',
            message: 'Article slug is required'
          }
        });
      }

      logger.info('Getting article by slug', { slug });

      const article = await contentService.getArticleBySlug(slug);

      if (!article) {
        return res.status(404).json({
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found'
          }
        });
      }

      // Increment view count (non-blocking)
      contentService.incrementViewCount(article.id).catch(err => {
        logger.warn('Failed to increment view count', { error: err.message });
      });

      return res.status(200).json({
        success: true,
        data: article
      });
    } catch (error: any) {
      logger.error('Get article by slug error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Get a single article by ID
   * GET /api/v1/content/articles/id/:id
   */
  async getArticleById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required'
          }
        });
      }

      logger.info('Getting article by ID', { id });

      const article = await contentService.getArticleById(id);

      if (!article) {
        return res.status(404).json({
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: article
      });
    } catch (error: any) {
      logger.error('Get article by ID error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Create a new article (admin only)
   * POST /api/v1/content/articles
   */
  async createArticle(req: Request, res: Response): Promise<Response> {
    try {
      const input = req.body;

      // Basic validation
      if (!input.title || !input.content || !input.author_id || !input.slug) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'Title, content, author_id, and slug are required'
          }
        });
      }

      logger.info('Creating new article', { title: input.title });

      const article = await contentService.createArticle(input);

      return res.status(201).json({
        success: true,
        data: article,
        message: 'Article created successfully'
      });
    } catch (error: any) {
      logger.error('Create article error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Update an existing article (admin only)
   * PUT /api/v1/content/articles/:id
   */
  async updateArticle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const input = req.body;

      if (!id) {
        return res.status(400).json({
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required'
          }
        });
      }

      logger.info('Updating article', { id });

      const article = await contentService.updateArticle(id, input);

      return res.status(200).json({
        success: true,
        data: article,
        message: 'Article updated successfully'
      });
    } catch (error: any) {
      logger.error('Update article error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }

  /**
   * Delete an article (admin only)
   * DELETE /api/v1/content/articles/:id
   */
  async deleteArticle(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: {
            code: 'MISSING_ID',
            message: 'Article ID is required'
          }
        });
      }

      logger.info('Deleting article', { id });

      await contentService.deleteArticle(id);

      return res.status(200).json({
        success: true,
        message: 'Article deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete article error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
}

export default new ContentController();