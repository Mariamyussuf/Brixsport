import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation rules for global search
export const globalSearchValidationRules = () => {
  return [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    
    query('entities')
      .optional()
      .isArray()
      .withMessage('Entities must be an array'),
      
    query('sort')
      .optional()
      .isIn(['relevance', 'date', 'popularity'])
      .withMessage('Sort must be one of: relevance, date, popularity'),
      
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
      
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
      
    query('fuzzy')
      .optional()
      .isBoolean()
      .withMessage('Fuzzy must be a boolean value'),
      
    query('sport')
      .optional()
      .isArray()
      .withMessage('Sport must be an array'),
      
    query('status')
      .optional()
      .isArray()
      .withMessage('Status must be an array'),
      
    query('location')
      .optional()
      .isString()
      .withMessage('Location must be a string'),
      
    query('from')
      .optional()
      .isISO8601()
      .withMessage('From must be a valid ISO date'),
      
    query('to')
      .optional()
      .isISO8601()
      .withMessage('To must be a valid ISO date')
  ];
};

// Validation rules for search suggestions
export const searchSuggestionsValidationRules = () => {
  return [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Search query must be between 1 and 50 characters'),
      
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ];
};

// Validation rules for trending searches
export const trendingSearchesValidationRules = () => {
  return [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ];
};

// Validation rules for rebuilding entity index
export const rebuildEntityIndexValidationRules = () => {
  return [
    param('entity')
      .notEmpty()
      .withMessage('Entity is required')
      .isIn(['user', 'player', 'team', 'competition', 'match', 'news', 'media'])
      .withMessage('Entity must be one of: user, player, team, competition, match, news, media')
  ];
};

// Validation middleware
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
  return; 
};