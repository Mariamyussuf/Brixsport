import { Router } from 'express';
import contentController from '../../controllers/content.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/rbac.middleware';

const router = Router();

// Public routes - no authentication required
router.get('/articles', contentController.getArticles);
router.get('/articles/:slug', contentController.getArticleBySlug);

// Public route to get article by ID
router.get('/articles/id/:id', contentController.getArticleById);

// Protected routes - require authentication and admin permissions
router.post('/articles', 
  authenticate, 
  hasPermission('admin:access'), 
  contentController.createArticle
);

router.put('/articles/:id', 
  authenticate, 
  hasPermission('admin:access'), 
  contentController.updateArticle
);

router.delete('/articles/:id', 
  authenticate, 
  hasPermission('admin:access'), 
  contentController.deleteArticle
);

export default router;