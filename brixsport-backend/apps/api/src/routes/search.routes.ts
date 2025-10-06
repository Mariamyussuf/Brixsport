import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';
import { 
  globalSearchValidationRules,
  searchSuggestionsValidationRules,
  trendingSearchesValidationRules,
  rebuildEntityIndexValidationRules,
  validate
} from '../validation/search.validation';
import { hasPermission } from '../middleware/rbac.middleware';

const router = Router();
const searchController = new SearchController();

/**
 * @route GET /api/search
 * @desc Global search across all entities
 * @access Authenticated users
 */
router.get('/', 
  authenticate,
  globalSearchValidationRules(),
  validate,
  searchController.globalSearch
);

/**
 * @route GET /api/search/suggestions
 * @desc Get search suggestions
 * @access Authenticated users
 */
router.get('/suggestions',
  authenticate,
  searchSuggestionsValidationRules(),
  validate,
  searchController.getSearchSuggestions
);

/**
 * @route GET /api/search/trending
 * @desc Get trending search terms
 * @access Public
 */
router.get('/trending',
  trendingSearchesValidationRules(),
  validate,
  searchController.getTrendingSearches
);

/**
 * @route POST /api/search/index
 * @desc Rebuild search index (admin only)
 * @access Admin only
 */
router.post('/index',
  authenticate,
  hasPermission('admin:access'),
  searchController.rebuildIndex
);

/**
 * @route POST /api/search/index/:entity
 * @desc Rebuild entity-specific search index (admin only)
 * @access Admin only
 */
router.post('/index/:entity',
  authenticate,
  hasPermission('admin:access'),
  rebuildEntityIndexValidationRules(),
  validate,
  searchController.rebuildEntityIndex
);

/**
 * @route GET /api/search/analytics
 * @desc Get search analytics (admin only)
 * @access Admin only
 */
router.get('/analytics',
  authenticate,
  hasPermission('admin:access'),
  searchController.getAnalytics
);

/**
 * @route DELETE /api/search/cache
 * @desc Clear search cache (admin only)
 * @access Admin only
 */
router.delete('/cache',
  authenticate,
  hasPermission('admin:access'),
  searchController.clearCache
);

export default router;