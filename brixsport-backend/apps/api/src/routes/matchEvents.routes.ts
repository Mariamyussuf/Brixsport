import { Router } from 'express';
import { matchEventController } from '../controllers/matchEvent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/rbac.middleware';
import { validate, validationSchemas } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new match event
// Requires event:create permission
router.post(
  '/',
  hasPermission('event:create'),
  validate(validationSchemas.createEvent),
  matchEventController.createEvent
);

// Get all events for a match
router.get(
  '/match/:matchId',
  matchEventController.getMatchEvents
);

// Update a match event
// Requires event:validate permission for certain event types
router.put(
  '/:eventId',
  hasPermission('event:create'),
  validate(validationSchemas.updateEvent),
  matchEventController.updateEvent
);

// Delete a match event
// Requires admin permissions
router.delete(
  '/:eventId',
  hasPermission('admin:access'),
  matchEventController.deleteEvent
);

export default router;