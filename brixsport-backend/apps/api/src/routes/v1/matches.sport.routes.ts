import { Router } from 'express';
import { matchController } from '../../controllers/match.sport.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { 
  listMatchesSchema,
  getMatchDetailsSchema,
  validate
} from '../../validation/match.validation';

const router = Router();

// Public routes (no authentication required)
// Get all matches by sport with filtering and pagination
router.get('/', validate(listMatchesSchema), matchController.listMatchesBySport);

// Get live matches by sport
router.get('/live', matchController.getLiveMatchesBySport);

// Get match details
router.get('/:id', validate(getMatchDetailsSchema), matchController.getMatchDetails);

// Sport-specific routes
// Football match extensions
router.get('/:id/football', matchController.getFootballMatchDetails);

// Basketball match extensions
router.get('/:id/basketball', matchController.getBasketballMatchDetails);

// Track event routes
router.get('/track/:id', matchController.getTrackEventDetails);

export default router;