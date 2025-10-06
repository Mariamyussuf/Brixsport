import { Router } from 'express';
import { matchesController } from '../../controllers/matches.controller';

const router = Router();

// Home & Discovery routes
router.get('/home', matchesController.getHomeFeed);
router.get('/discover', matchesController.getDiscoverContent);
router.get('/trending', matchesController.getTrending);

// Competitions routes
router.get('/competitions', matchesController.listCompetitions);
router.get('/competitions/:id', matchesController.getCompetition);
router.get('/competitions/:id/matches', matchesController.getCompetitionMatches);
router.get('/competitions/:id/standings', matchesController.getCompetitionStandings);
router.get('/competitions/:id/stats', matchesController.getCompetitionStats);
router.post('/competitions', matchesController.createCompetition);
router.put('/competitions/:id', matchesController.updateCompetition);
router.delete('/competitions/:id', matchesController.deleteCompetition);

// Teams routes
router.get('/teams', matchesController.listTeams);
router.get('/teams/:id', matchesController.getTeam);
router.get('/teams/:id/matches', matchesController.getTeamMatches);
router.get('/teams/:id/players', matchesController.getTeamPlayers);
router.get('/teams/:id/stats', matchesController.getTeamStats);
router.post('/teams', matchesController.createTeam);
router.put('/teams/:id', matchesController.updateTeam);
router.delete('/teams/:id', matchesController.deleteTeam);

// Players routes
router.get('/players', matchesController.listPlayers);
router.get('/players/:id', matchesController.getPlayer);
router.get('/players/:id/matches', matchesController.getPlayerMatches);
router.get('/players/:id/stats', matchesController.getPlayerStats);
router.post('/players', matchesController.createPlayer);
router.put('/players/:id', matchesController.updatePlayer);
router.delete('/players/:id', matchesController.deletePlayer);

// Matches routes - this is the main endpoint for listing matches with filters
router.get('/', matchesController.listMatches);
router.get('/:id', matchesController.getMatch);
router.get('/:id/events', matchesController.getMatchEvents);
router.get('/:id/lineups', matchesController.getMatchLineups);
router.get('/:id/stats', matchesController.getMatchStats);
router.post('/', matchesController.createMatch);
router.put('/:id', matchesController.updateMatch);
router.delete('/:id', matchesController.deleteMatch);

export default router;