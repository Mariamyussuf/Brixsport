import { Router } from 'express';
import { trackController } from '../../controllers/track.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { 
  getTrackEventSchema,
  listTrackEventsSchema,
  validate
} from '../../validation/track.validation';

const router = Router();

// Public routes (no authentication required)
// List track events
router.get('/', validate(listTrackEventsSchema), trackController.listTrackEvents);

// Get track event details
router.get('/:id', validate(getTrackEventSchema), trackController.getTrackEventDetails);

// Admin routes (authentication required)
router.use(authenticate);

// Create track event (admin)
router.post('/', trackController.createTrackEvent);

// Update track event (admin)
router.put('/:id', trackController.updateTrackEvent);

// Submit results (logger)
router.post('/:id/results', trackController.submitResults);

// Update result (logger)
router.put('/:id/results/:resultId', trackController.updateResult);

export default router;