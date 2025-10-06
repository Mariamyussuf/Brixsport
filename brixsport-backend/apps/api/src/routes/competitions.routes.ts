import { Router } from 'express';
import { competitionController } from '../controllers/competition.controller';
import { authenticate } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/rbac.middleware';
import { UserRole } from '../middleware/rbac.middleware';

const router = Router();

// Public routes
router.get('/', competitionController.listCompetitions);
router.get('/:id/groups', competitionController.getCompetitionGroups);
router.get('/:id/group-standings', competitionController.getGroupStandings);
router.get('/:id/knockout-structure', competitionController.getKnockoutStructure);
router.get('/:id/final-standings', competitionController.getFinalStandings);
router.get('/:id/statistics', competitionController.getCompetitionStatistics);
router.get('/:id/matches', competitionController.getCompetitionMatches);

// Protected routes - Admin/Logger only
router.post('/', authenticate, hasPermission('competition:create'), competitionController.createCompetition);
router.post('/:id/start-registration', authenticate, hasPermission('competition:manage'), competitionController.startRegistration);
router.post('/:id/teams', authenticate, hasPermission('competition:manage'), competitionController.addTeamToCompetition);
router.post('/:id/generate-groups', authenticate, hasPermission('competition:manage'), competitionController.generateGroups);
router.post('/:id/generate-group-fixtures', authenticate, hasPermission('competition:manage'), competitionController.generateGroupFixtures);
router.post('/:id/start-group-stage', authenticate, hasPermission('competition:manage'), competitionController.startGroupStage);
router.post('/:id/determine-knockout-teams', authenticate, hasPermission('competition:manage'), competitionController.determineKnockoutTeams);
router.post('/:id/generate-knockout-fixtures', authenticate, hasPermission('competition:manage'), competitionController.generateKnockoutFixtures);
router.post('/:id/start-knockout-stage', authenticate, hasPermission('competition:manage'), competitionController.startKnockoutStage);
router.post('/:id/complete', authenticate, hasPermission('competition:manage'), competitionController.completeCompetition);
router.post('/:id/cancel', authenticate, hasPermission('competition:manage'), competitionController.cancelCompetition);
router.put('/:id/matches/:match_id/reschedule', authenticate, hasPermission('competition:manage'), competitionController.rescheduleMatch);
router.post('/:id/matches/:match_id/postpone', authenticate, hasPermission('competition:manage'), competitionController.postponeMatch);

export default router;