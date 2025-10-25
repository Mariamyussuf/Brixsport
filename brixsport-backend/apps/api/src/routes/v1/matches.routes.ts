import { Router } from 'express';
import { matchesController } from '../../controllers/matches.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/rbac.middleware';

const router = Router();

// Home & Discovery routes (public)
router.get('/home', matchesController.getHomeFeed);
router.get('/discover', matchesController.getDiscoverContent);
router.get('/trending', matchesController.getTrending);

// Competitions routes
router.get('/competitions', matchesController.listCompetitions);
router.get('/competitions/:id', matchesController.getCompetition);
router.get('/competitions/:id/matches', matchesController.getCompetitionMatches);
router.get('/competitions/:id/standings', matchesController.getCompetitionStandings);
router.get('/competitions/:id/stats', matchesController.getCompetitionStats);
router.post('/competitions', authenticate, hasPermission('admin:access'), matchesController.createCompetition);
router.put('/competitions/:id', authenticate, hasPermission('admin:access'), matchesController.updateCompetition);
router.delete('/competitions/:id', authenticate, hasPermission('admin:access'), matchesController.deleteCompetition);

// Teams routes
router.get('/teams', matchesController.listTeams);
router.get('/teams/:id', matchesController.getTeam);
router.get('/teams/:id/matches', matchesController.getTeamMatches);
router.get('/teams/:id/players', matchesController.getTeamPlayers);
router.get('/teams/:id/stats', matchesController.getTeamStats);
router.post('/teams', authenticate, hasPermission('admin:access'), matchesController.createTeam);
router.put('/teams/:id', authenticate, hasPermission('admin:access'), matchesController.updateTeam);
router.delete('/teams/:id', authenticate, hasPermission('admin:access'), matchesController.deleteTeam);

// Players routes
router.get('/players', matchesController.listPlayers);
router.get('/players/:id', matchesController.getPlayer);
router.get('/players/:id/matches', matchesController.getPlayerMatches);
router.get('/players/:id/stats', matchesController.getPlayerStats);
router.post('/players', authenticate, hasPermission('admin:access'), matchesController.createPlayer);
router.put('/players/:id', authenticate, hasPermission('admin:access'), matchesController.updatePlayer);
router.delete('/players/:id', authenticate, hasPermission('admin:access'), matchesController.deletePlayer);

// Matches routes - this is the main endpoint for listing matches with filters
router.get('/', matchesController.listMatches);
router.get('/:id', matchesController.getMatch);
router.get('/:id/events', matchesController.getMatchEvents);
router.get('/:id/lineups', matchesController.getMatchLineups);
router.get('/:id/stats', matchesController.getMatchStats);
router.post('/', authenticate, hasPermission('admin:access'), matchesController.createMatch);
router.put('/:id', authenticate, hasPermission('admin:access'), matchesController.updateMatch);
router.delete('/:id', authenticate, hasPermission('admin:access'), matchesController.deleteMatch);

export default router;