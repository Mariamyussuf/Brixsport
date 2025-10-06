import { Router } from 'express';
import { favoritesController } from '../../controllers/favorites.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all user favorites (teams, competitions, players)
router.get('/', favoritesController.getUserFavorites);

// Add a favorite
router.post('/', favoritesController.addFavorite);

// Remove a favorite
router.delete('/', favoritesController.removeFavorite);

export default router;