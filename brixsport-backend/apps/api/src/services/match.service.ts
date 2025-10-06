import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

interface Match {
  id: string;
  competition_id: string;
  competition_name?: string;
  competition_logo?: string;
  competition_country?: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score?: number;
  away_score?: number;
  status: string;
  match_date: string;
  venue?: string;
  current_minute?: number;
  period?: string;
  home_team_logo?: string;
  away_team_logo?: string;
  home_team_short_name?: string;
  away_team_short_name?: string;
  timestamp: number;
}

interface TeamStats {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface CompetitionStats {
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  homeGoals: number;
  awayGoals: number;
  homeGoalPercentage: number;
  awayGoalPercentage: number;
  highestScoringTeam: string;
  highestTeamGoals: number;
  goalDistribution: Record<number, number>;
}

export const matchService = {
  // Home & Discovery
  getHomeFeed: async (userId: string) => {
    try {
      logger.info('Fetching home feed', { userId });
      
      // Fetch featured matches, trending teams, and upcoming matches from Supabase
      const [featuredMatchesResult, trendingTeamsResult, upcomingMatchesResult] = await Promise.all([
        supabaseService.listMatches({ status: 'live' }),
        supabaseService.listTeams(),
        supabaseService.listMatches({ status: 'scheduled' })
      ]);
      
      // Safely extract data with proper typing from supabaseService response
      const getFirstN = <T>(result: { success: boolean; data?: T[] | any }, n: number): T[] => {
        if (!result || !result.success) {
          return [];
        }
        
        // Handle different response formats
        const data = result.data;
        if (Array.isArray(data)) {
          return data.slice(0, n);
        }
        
        // If data is an object with a data array property (nested response)
        if (data && Array.isArray(data.data)) {
          return data.data.slice(0, n);
        }
        
        return [];
      };
      
      return {
        success: true,
        data: {
          featuredMatches: getFirstN<Match>(featuredMatchesResult, 5),
          trendingTeams: getFirstN(trendingTeamsResult, 5),
          upcomingMatches: getFirstN<Match>(upcomingMatchesResult, 5)
        }
      };
    } catch (error: any) {
      logger.error('Home feed error', error);
      throw error;
    }
  },
  
  getDiscoverContent: async () => {
    try {
      logger.info('Fetching discover content');
      
      // Fetch popular competitions, top players, and featured teams from Supabase
      const [popularCompetitionsResult, topPlayersResult, featuredTeamsResult] = await Promise.all([
        supabaseService.listCompetitions(),
        supabaseService.listTeams(),
        supabaseService.listTeams()
      ]);
      
      // Safely handle array operations with type checking
      const getFirstN = (arr: any[] | undefined, n: number) => 
        Array.isArray(arr) ? arr.slice(0, n) : [];
      
      return {
        success: true,
        data: {
          popularCompetitions: getFirstN(popularCompetitionsResult.data, 10),
          topPlayers: [], // We'll implement this when we have a players service
          featuredTeams: getFirstN(featuredTeamsResult.data, 10)
        }
      };
    } catch (error: any) {
      logger.error('Discover content error', error);
      throw error;
    }
  },
  
  getTrending: async () => {
    try {
      logger.info('Fetching trending content');
      
      // Fetch trending matches and teams from Supabase
      const [trendingMatchesResult, trendingTeamsResult] = await Promise.all([
        supabaseService.listMatches({ status: 'live' }),
        supabaseService.listTeams()
      ]);
      
      // Safely extract data with proper typing from supabaseService response
      const getFirstN = <T>(result: { success: boolean; data?: T[] | any }, n: number): T[] => {
        if (!result || !result.success) {
          return [];
        }
        
        // Handle different response formats
        const data = result.data;
        if (Array.isArray(data)) {
          return data.slice(0, n);
        }
        
        // If data is an object with a data array property (nested response)
        if (data && Array.isArray(data.data)) {
          return data.data.slice(0, n);
        }
        
        return [];
      };
      
      return {
        success: true,
        data: {
          trendingMatches: getFirstN<Match>(trendingMatchesResult, 10),
          trendingTeams: getFirstN(trendingTeamsResult, 10)
        }
      };
    } catch (error: any) {
      logger.error('Trending content error', error);
      throw error;
    }
  },
  
  // Competitions
  listCompetitions: async (filters: any) => {
    try {
      logger.info('Listing competitions', { filters });
      
      return await supabaseService.listCompetitions(filters);
    } catch (error: any) {
      logger.error('List competitions error', error);
      throw error;
    }
  },
  
  getCompetition: async (id: string) => {
    try {
      logger.info('Fetching competition', { id });
      
      return await supabaseService.getCompetition(id);
    } catch (error: any) {
      logger.error('Get competition error', error);
      throw error;
    }
  },
  
  getCompetitionMatches: async (id: string) => {
    try {
      logger.info('Fetching competition matches', { id });
      
      return await supabaseService.getCompetitionMatches(id);
    } catch (error: any) {
      logger.error('Get competition matches error', error);
      throw error;
    }
  },
  
  getCompetitionStandings: async (id: string) => {
    try {
      logger.info('Fetching competition standings', { id });
      
      // Get all matches for this competition
      const matchesResult = await supabaseService.getCompetitionMatches(id);
      if (!matchesResult.success || !matchesResult.data) {
        throw new Error('Failed to fetch competition matches');
      }
      
      const matches: Match[] = Array.isArray(matchesResult.data) ? matchesResult.data : [];
      
      // Calculate standings based on match results
      const teamStats: Record<string, any> = {};
      
      // Initialize stats for all teams in the competition
      const teamsInCompetition = new Set<string>();
      matches.forEach((match: Match) => {
        teamsInCompetition.add(match.home_team_id);
        teamsInCompetition.add(match.away_team_id);
      });
      
      teamsInCompetition.forEach(teamId => {
        teamStats[teamId] = {
          teamId,
          teamName: '', // Will be filled in later
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        };
      });
      
      // Process each match to calculate stats
      matches.forEach((match: Match) => {
        // Update team names if not already set
        if (teamStats[match.home_team_id].teamName === '') {
          teamStats[match.home_team_id].teamName = match.home_team_name || 'Unknown Team';
        }
        if (teamStats[match.away_team_id].teamName === '') {
          teamStats[match.away_team_id].teamName = match.away_team_name || 'Unknown Team';
        }
        
        // Only process finished matches
        if (match.status === 'finished') {
          const homeScore = match.home_score ?? 0;
          const awayScore = match.away_score ?? 0;
          
          teamStats[match.home_team_id].played++;
          teamStats[match.away_team_id].played++;
          
          teamStats[match.home_team_id].goalsFor += homeScore;
          teamStats[match.home_team_id].goalsAgainst += awayScore;
          teamStats[match.away_team_id].goalsFor += awayScore;
          teamStats[match.away_team_id].goalsAgainst += homeScore;
          
          // Determine match outcome
          if (homeScore > awayScore) {
            // Home team won
            teamStats[match.home_team_id].won++;
            teamStats[match.home_team_id].points += 3;
            teamStats[match.away_team_id].lost++;
          } else if (homeScore < awayScore) {
            // Away team won
            teamStats[match.away_team_id].won++;
            teamStats[match.away_team_id].points += 3;
            teamStats[match.home_team_id].lost++;
          } else {
            // Draw
            teamStats[match.home_team_id].drawn++;
            teamStats[match.home_team_id].points += 1;
            teamStats[match.away_team_id].drawn++;
            teamStats[match.away_team_id].points += 1;
          }
        }
      });
      
      // Convert to array and sort by points (descending), then by goal difference (descending)
      const standings = Object.values(teamStats).sort((a: any, b: any) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        const aGoalDiff = a.goalsFor - a.goalsAgainst;
        const bGoalDiff = b.goalsFor - b.goalsAgainst;
        return bGoalDiff - aGoalDiff;
      });
      
      return {
        success: true,
        data: standings
      };
    } catch (error: any) {
      logger.error('Get competition standings error', error);
      throw error;
    }
  },
  
  getCompetitionStats: async (id: string) => {
    try {
      logger.info('Fetching competition stats', { id });
      
      // Get all matches for this competition
      const matchesResult = await supabaseService.getCompetitionMatches(id);
      if (!matchesResult.success || !matchesResult.data) {
        throw new Error('Failed to fetch competition matches');
      }
      
      const matches: Match[] = Array.isArray(matchesResult.data) ? matchesResult.data : [];
      
      // Calculate competition statistics
      let totalMatches = 0;
      let totalGoals = 0;
      let totalHomeGoals = 0;
      let totalAwayGoals = 0;
      const teamGoals: Record<string, number> = {};
      const goalDistribution: Record<number, number> = {};
      
      matches.forEach((match: Match) => {
        if (match.status === 'finished') {
          totalMatches++;
          const homeScore = match.home_score || 0;
          const awayScore = match.away_score || 0;
          const totalMatchGoals = homeScore + awayScore;
          
          totalGoals += totalMatchGoals;
          totalHomeGoals += homeScore;
          totalAwayGoals += awayScore;
          
          // Track goals per team
          teamGoals[match.home_team_id] = (teamGoals[match.home_team_id] || 0) + homeScore;
          teamGoals[match.away_team_id] = (teamGoals[match.away_team_id] || 0) + awayScore;
          
          // Track goal distribution
          goalDistribution[totalMatchGoals] = (goalDistribution[totalMatchGoals] || 0) + 1;
        }
      });
      
      // Find highest scoring team
      let highestScoringTeam = '';
      let highestTeamGoals = 0;
      Object.entries(teamGoals).forEach(([teamId, goals]) => {
        if (goals > highestTeamGoals) {
          highestTeamGoals = goals;
          highestScoringTeam = teamId;
        }
      });
      
      const stats = {
        totalMatches,
        totalGoals,
        averageGoalsPerMatch: totalMatches > 0 ? totalGoals / totalMatches : 0,
        homeGoals: totalHomeGoals,
        awayGoals: totalAwayGoals,
        homeGoalPercentage: totalGoals > 0 ? (totalHomeGoals / totalGoals) * 100 : 0,
        awayGoalPercentage: totalGoals > 0 ? (totalAwayGoals / totalGoals) * 100 : 0,
        highestScoringTeam,
        highestTeamGoals,
        goalDistribution
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      logger.error('Get competition stats error', error);
      throw error;
    }
  },
  
  createCompetition: async (data: any) => {
    try {
      // Validate required fields
      if (!data.name) {
        throw new Error('Competition name is required');
      }
      
      if (!data.startDate || !data.endDate) {
        throw new Error('Start date and end date are required');
      }
      
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }
      
      if (!data.type || !['league', 'cup', 'tournament', 'friendly'].includes(data.type)) {
        throw new Error('Invalid competition type');
      }
      
      logger.info('Creating competition', { data });
      
      return await supabaseService.createCompetition(data);
    } catch (error: any) {
      logger.error('Create competition error', error);
      throw error;
    }
  },
  
  updateCompetition: async (id: string, data: any) => {
    try {
      logger.info('Updating competition', { id, data });
      
      return await supabaseService.updateCompetition(id, data);
    } catch (error: any) {
      logger.error('Update competition error', error);
      throw error;
    }
  },
  
  deleteCompetition: async (id: string) => {
    try {
      logger.info('Deleting competition', { id });
      
      return await supabaseService.deleteCompetition(id);
    } catch (error: any) {
      logger.error('Delete competition error', error);
      throw error;
    }
  },
  
  // Teams
  listTeams: async (filters: any) => {
    try {
      logger.info('Listing teams', { filters });
      
      return await supabaseService.listTeams(filters);
    } catch (error: any) {
      logger.error('List teams error', error);
      throw error;
    }
  },
  
  getTeam: async (id: string) => {
    try {
      logger.info('Fetching team', { id });
      
      return await supabaseService.getTeam(id);
    } catch (error: any) {
      logger.error('Get team error', error);
      throw error;
    }
  },
  
  getTeamMatches: async (id: string) => {
    try {
      logger.info('Fetching team matches', { id });
      
      return await supabaseService.getTeamMatches(id);
    } catch (error: any) {
      logger.error('Get team matches error', error);
      throw error;
    }
  },
  
  getTeamPlayers: async (id: string) => {
    try {
      logger.info('Fetching team players', { id });
      
      // Get players for this team from Supabase
      const playersResult = await supabaseService.listPlayers({ teamId: id });
      if (!playersResult.success) {
        throw new Error('Failed to fetch team players');
      }
      
      return {
        success: true,
        data: playersResult.data
      };
    } catch (error: any) {
      logger.error('Get team players error', error);
      throw error;
    }
  },
  
  getTeamStats: async (id: string) => {
    try {
      logger.info('Fetching team stats', { id });
      
      // Get team information
      const teamResult = await supabaseService.getTeam(id);
      if (!teamResult.success) {
        throw new Error('Failed to fetch team');
      }
      
      const team = teamResult.data;
      
      // Get all matches for this team
      const matchesResult = await supabaseService.getTeamMatches(id, { status: 'all' });
      if (!matchesResult.success || !matchesResult.data) {
        throw new Error('Failed to fetch team matches');
      }
      
      // Ensure matches is always an array
      const matches = Array.isArray(matchesResult.data) ? matchesResult.data : [];
      
      // Calculate team statistics
      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let points = 0;
      
      matches.forEach(match => {
        if (match.status === 'finished') {
          played++;
          goalsFor += match.home_team_id === id ? (match.home_score || 0) : (match.away_score || 0);
          goalsAgainst += match.home_team_id === id ? (match.away_score || 0) : (match.home_score || 0);
          
          // Determine match outcome for this team
          if (match.home_team_id === id) {
            if (match.home_score > match.away_score) {
              won++;
              points += 3;
            } else if (match.home_score < match.away_score) {
              lost++;
            } else {
              drawn++;
              points += 1;
            }
          } else {
            if (match.away_score > match.home_score) {
              won++;
              points += 3;
            } else if (match.away_score < match.home_score) {
              lost++;
            } else {
              drawn++;
              points += 1;
            }
          }
        }
      });
      
      const stats = {
        teamId: id,
        teamName: team.name,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        winRate: played > 0 ? (won / played) * 100 : 0
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      logger.error('Get team stats error', error);
      throw error;
    }
  },
  
  createTeam: async (data: any) => {
    try {
      logger.info('Creating team', { data });
      
      return await supabaseService.createTeam(data);
    } catch (error: any) {
      logger.error('Create team error', error);
      throw error;
    }
  },
  
  updateTeam: async (id: string, data: any) => {
    try {
      logger.info('Updating team', { id, data });
      
      return await supabaseService.updateTeam(id, data);
    } catch (error: any) {
      logger.error('Update team error', error);
      throw error;
    }
  },
  
  deleteTeam: async (id: string) => {
    try {
      logger.info('Deleting team', { id });
      
      return await supabaseService.deleteTeam(id);
    } catch (error: any) {
      logger.error('Delete team error', error);
      throw error;
    }
  },
  
  // Matches
  listMatches: async (filters: any = {}) => {
    try {
      logger.info('Listing matches with filters', { 
        ...filters,
        // Don't log full filter object to avoid sensitive data in logs
        page: filters.page || 1,
        limit: filters.limit || 50,
        hasDateRange: !!(filters.dateFrom || filters.dateTo)
      });
      
      // Map frontend status to database status
      const statusMap: Record<string, string> = {
        'live': 'in_progress',
        'upcoming': 'scheduled',
        'finished': 'completed',
        'all': 'all'
      };
      
      // Prepare filters for Supabase
      const supabaseFilters: any = { ...filters };
      
      // Map status if provided
      if (filters.status && statusMap[filters.status]) {
        supabaseFilters.status = statusMap[filters.status];
      }
      
      // Ensure pagination defaults
      supabaseFilters.page = parseInt(filters.page) || 1;
      supabaseFilters.limit = parseInt(filters.limit) || 50;
      
      // Get matches from Supabase with applied filters
      const result = await supabaseService.listMatches(supabaseFilters);
      
      // If we have data, ensure it's properly typed as Match[]
      if (result.success) {
        const matches: Match[] = Array.isArray(result.data) ? result.data : [];
        
        // Return paginated and filtered results
        return {
          success: true,
          data: matches,
          meta: {
            total: result.meta?.total || matches.length,
            page: supabaseFilters.page,
            limit: supabaseFilters.limit,
            pages: result.meta?.pages || Math.ceil((result.meta?.total || matches.length) / supabaseFilters.limit)
          }
        };
      }
      
      return result;
    } catch (error: any) {
      logger.error('List matches error', error);
      throw error;
    }
  },
  
  getMatch: async (id: string) => {
    try {
      logger.info('Fetching match', { id });
      
      return await supabaseService.getMatch(id);
    } catch (error: any) {
      logger.error('Get match error', error);
      throw error;
    }
  },
  
  createMatch: async (data: any) => {
    try {
      logger.info('Creating match', { data });
      
      return await supabaseService.createMatch(data);
    } catch (error: any) {
      logger.error('Create match error', error);
      throw error;
    }
  },
  
  updateMatch: async (id: string, data: any) => {
    try {
      logger.info('Updating match', { id, data });
      
      return await supabaseService.updateMatch(id, data);
    } catch (error: any) {
      logger.error('Update match error', error);
      throw error;
    }
  },
  
  deleteMatch: async (id: string) => {
    try {
      logger.info('Deleting match', { id });
      
      return await supabaseService.deleteMatch(id);
    } catch (error: any) {
      logger.error('Delete match error', error);
      throw error;
    }
  },
  
  // Players
  listPlayers: async (filters: any) => {
    try {
      logger.info('Listing players', { filters });
      
      return await supabaseService.listPlayers(filters);
    } catch (error: any) {
      logger.error('List players error', error);
      throw error;
    }
  },
  
  getPlayer: async (id: string) => {
    try {
      logger.info('Fetching player', { id });
      
      return await supabaseService.getPlayer(id);
    } catch (error: any) {
      logger.error('Get player error', error);
      throw error;
    }
  },
  
  getPlayerMatches: async (id: string) => {
    try {
      logger.info('Fetching player matches', { id });
      
      // Get match events for this player
      const eventsResult = await supabaseService.getMatchEventsByPlayer(id);
      if (!eventsResult.success) {
        throw new Error('Failed to fetch player match events');
      }
      
      const events = eventsResult.data;
      
      // Extract unique match IDs from events
      const matchIds = [...new Set(events.map(event => event.matchId))];
      
      // Get match details for each match
      const matches = [];
      for (const matchId of matchIds) {
        const matchResult = await supabaseService.getMatch(matchId);
        if (matchResult.success) {
          matches.push(matchResult.data);
        }
      }
      
      return {
        success: true,
        data: matches
      };
    } catch (error: any) {
      logger.error('Get player matches error', error);
      throw error;
    }
  },
  
  getPlayerStats: async (id: string) => {
    try {
      logger.info('Fetching player stats', { id });
      
      // Get player information
      const playerResult = await supabaseService.getPlayer(id);
      if (!playerResult.success) {
        throw new Error('Failed to fetch player');
      }
      
      const player = playerResult.data;
      
      // Get match events for this player
      const eventsResult = await supabaseService.getMatchEventsByPlayer(id);
      if (!eventsResult.success) {
        throw new Error('Failed to fetch player match events');
      }
      
      const events = eventsResult.data;
      
      // Calculate player statistics
      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCards = 0;
      const matchIds = new Set();
      
      events.forEach(event => {
        matchIds.add(event.matchId);
        
        switch (event.eventType) {
          case 'goal':
            goals++;
            break;
          case 'assist':
            assists++;
            break;
          case 'yellow_card':
            yellowCards++;
            break;
          case 'red_card':
            redCards++;
            break;
        }
      });
      
      const stats = {
        playerId: id,
        playerName: player.name,
        matchesPlayed: matchIds.size,
        goals,
        assists,
        yellowCards,
        redCards,
        goalAssistRatio: goals + assists > 0 ? (goals / (goals + assists)).toFixed(2) : 0
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      logger.error('Get player stats error', error);
      throw error;
    }
  },
  
  createPlayer: async (data: any) => {
    try {
      logger.info('Creating player', { data });
      
      // Create player in Supabase
      const result = await supabaseService.createPlayer(data);
      return result;
    } catch (error: any) {
      logger.error('Create player error', error);
      throw error;
    }
  },
  
  updatePlayer: async (id: string, data: any) => {
    try {
      logger.info('Updating player', { id, data });
      
      // Update player in Supabase
      const result = await supabaseService.updatePlayer(id, data);
      return result;
    } catch (error: any) {
      logger.error('Update player error', error);
      throw error;
    }
  },
  
  deletePlayer: async (id: string) => {
    try {
      logger.info('Deleting player', { id });
      
      // Delete player from Supabase
      const result = await supabaseService.deletePlayer(id);
      return result;
    } catch (error: any) {
      logger.error('Delete player error', error);
      throw error;
    }
  },
  
  getMatchEvents: async (id: string) => {
    try {
      logger.info('Fetching match events', { id });
      
      return await supabaseService.getMatchEventsByMatch(id);
    } catch (error: any) {
      logger.error('Get match events error', error);
      throw error;
    }
  },
  
  getMatchLineups: async (id: string) => {
    try {
      logger.info('Fetching match lineups', { id });
      
      // Get match lineups from Supabase
      const result = await supabaseService.getMatchLineups(id);
      return result;
    } catch (error: any) {
      logger.error('Get match lineups error', error);
      throw error;
    }
  },
  
  getMatchStats: async (id: string) => {
    try {
      logger.info('Fetching match stats', { id });
      
      // Get the match
      const matchResult = await supabaseService.getMatch(id);
      if (!matchResult.success) {
        throw new Error('Failed to fetch match');
      }
      
      const match = matchResult.data as Match;
      
      // Get match events
      const eventsResult = await supabaseService.getMatchEventsByMatch(id);
      if (!eventsResult.success) {
        throw new Error('Failed to fetch match events');
      }
      
      const events = eventsResult.data;
      
      // Calculate match statistics
      const homeTeamEvents = events.filter(event => event.teamId === match.home_team_id);
      const awayTeamEvents = events.filter(event => event.teamId === match.away_team_id);
      
      const stats = {
        matchId: id,
        homeTeam: {
          teamId: match.home_team_id,
          teamName: match.home_team_name,
          goals: match.home_score || 0,
          events: homeTeamEvents.length,
          goalsEvents: homeTeamEvents.filter(e => e.eventType === 'goal').length,
          cardEvents: homeTeamEvents.filter(e => e.eventType === 'yellow_card' || e.eventType === 'red_card').length
        },
        awayTeam: {
          teamId: match.away_team_id,
          teamName: match.away_team_name,
          goals: match.away_score || 0,
          events: awayTeamEvents.length,
          goalsEvents: awayTeamEvents.filter(e => e.eventType === 'goal').length,
          cardEvents: awayTeamEvents.filter(e => e.eventType === 'yellow_card' || e.eventType === 'red_card').length
        }
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      logger.error('Get match stats error', error);
      throw error;
    }
  }
};