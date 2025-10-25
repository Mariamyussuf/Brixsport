import { Router, Request, Response, NextFunction } from 'express';
import { TeamController } from '../../controllers/team.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/rbac.middleware';
import { 
  teamValidationRules,
  addPlayerValidationRules,
  removePlayerValidationRules,
  getTeamsValidationRules,
  getMatchesValidationRules,
  searchTeamsValidationRules,
  getTeamValidationRules,
  updateTeamValidationRules,
  deleteTeamValidationRules
} from '../../validation/team.validation';

const router = Router();
const teamController = new TeamController();

/**
 * @route GET /api/v1/teams
 * @desc Get all teams with pagination and filtering
 * @access Public
 */
router.get('/', 
  getTeamsValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = getTeamsValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.getTeams
);

/**
 * @route GET /api/v1/teams/search
 * @desc Advanced search for teams
 * @access Public
 */
router.get('/search', 
  searchTeamsValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = searchTeamsValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.searchTeams
);

/**
 * @route POST /api/v1/teams
 * @desc Create a new team
 * @access Private (Admin/Organizer)
 */
router.post('/', 
  authenticate,
  hasPermission('admin:access'),
  teamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = teamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.createTeam
);

/**
 * @route GET /api/v1/teams/:id
 * @desc Get a specific team by ID
 * @access Public
 */
router.get('/:id', 
  getTeamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = getTeamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.getTeamById
);

/**
 * @route PUT /api/v1/teams/:id
 * @desc Update an existing team
 * @access Private (Admin/Organizer)
 */
router.put('/:id', 
  authenticate,
  hasPermission('admin:access'),
  updateTeamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = updateTeamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.updateTeam
);

/**
 * @route DELETE /api/v1/teams/:id
 * @desc Delete a team (soft delete)
 * @access Private (Admin)
 */
router.delete('/:id', 
  authenticate,
  hasPermission('admin:access'),
  deleteTeamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = deleteTeamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.deleteTeam
);

/**
 * @route GET /api/v1/teams/:id/players
 * @desc Get all players for a specific team
 * @access Public
 */
router.get('/:id/players', 
  getTeamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = getTeamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.getTeamPlayers
);

/**
 * @route POST /api/v1/teams/:id/players
 * @desc Add a player to a team
 * @access Private (Admin/Organizer)
 */
router.post('/:id/players', 
  authenticate,
  hasPermission('admin:access'),
  addPlayerValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = addPlayerValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.addPlayerToTeam
);

/**
 * @route DELETE /api/v1/teams/:id/players/:playerId
 * @desc Remove a player from a team
 * @access Private (Admin/Organizer)
 */
router.delete('/:id/players/:playerId', 
  authenticate,
  hasPermission('admin:access'),
  removePlayerValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = removePlayerValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.removePlayerFromTeam
);

/**
 * @route GET /api/v1/teams/:id/matches
 * @desc Get all matches for a specific team
 * @access Public
 */
router.get('/:id/matches', 
  getMatchesValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = getMatchesValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.getTeamMatches
);

/**
 * @route GET /api/v1/teams/:id/stats
 * @desc Get team statistics
 * @access Public
 */
router.get('/:id/stats', 
  getTeamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = getTeamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.getTeamStats
);

/**
 * @route GET /api/v1/teams/:id/competitions
 * @desc Get all competitions a team is participating in
 * @access Public
 */
router.get('/:id/competitions', 
  getTeamValidationRules(), 
  (req: Request, res: Response, next: NextFunction) => {
    // Execute the first validation middleware
    const validationMiddleware = getTeamValidationRules()[0];
    validationMiddleware(req, res, next);
  },
  teamController.getTeamCompetitions
);

export default router;