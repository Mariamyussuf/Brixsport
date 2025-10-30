import { Team, Player, Match, Competition, TeamStats, PaginatedTeams, PaginatedMatches, PaginatedPlayers } from '../types/team.types';
import { supabaseService } from './supabase.service';
import { supabase } from './supabase.service';

// Define ApiError interface locally
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: object;
  };
}

export class TeamService {
  // Get all teams with pagination and filtering
  async getTeams(
    page: number = 1,
    limit: number = 20,
    sport?: string,
    status?: string,
    search?: string,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<PaginatedTeams> {
    try {
      // Build filters for database query
      const filters: any = {
        page,
        limit
      };

      // Apply filters
      if (sport) {
        filters.sport = sport;
      }

      if (status) {
        filters.status = status;
      }

      // Use database service to get teams with proper pagination
      const response = await supabaseService.listTeams(filters);

      if (!response.success) {
        throw new Error('Failed to fetch teams from database');
      }

      let teams = response.data;

      // Apply search filter if needed (in memory for now, but could be improved with full-text search)
      if (search) {
        const searchTerm = search.toLowerCase();
        teams = teams.filter(team =>
          team.name.toLowerCase().includes(searchTerm) ||
          (team.city && team.city.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      teams.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'city':
            comparison = (a.city || '').localeCompare(b.city || '');
            break;
          case 'foundedYear':
            comparison = (a.foundedYear || 0) - (b.foundedYear || 0);
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }
        return sortOrder === 'ASC' ? comparison : -comparison;
      });

      // Apply pagination in memory for filtered/sorted results
      const total = teams.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedTeams = teams.slice(startIndex, startIndex + limit);

      return {
        teams: paginatedTeams,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error: any) {
      console.error('Error in getTeams:', error);
      throw error;
    }
  }
  
  // Get a specific team by ID
  async getTeamById(id: string): Promise<Team | null> {
    try {
      const response = await supabaseService.getTeam(id);

      if (!response.success) {
        console.error('Error fetching team:', response);
        return null;
      }

      return response.data;
    } catch (error: any) {
      console.error('Error in getTeamById:', error);
      return null;
    }
  }
  
  // Create a new team
  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    try {
      // Check if team with same name already exists
      const existingResponse = await supabaseService.listTeams({ name: teamData.name });

      if (existingResponse.success && existingResponse.data.length > 0) {
        const existingTeam = existingResponse.data.find((team: Team) =>
          team.name === teamData.name && team.sport === teamData.sport
        );

        if (existingTeam) {
          throw {
            error: {
              code: 'TEAM_EXISTS',
              message: 'A team with this name and sport already exists'
            }
          } as ApiError;
        }
      }

      const response = await supabaseService.createTeam(teamData);

      if (!response.success) {
        throw new Error('Failed to create team in database');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error in createTeam:', error);
      throw error;
    }
  }
  
  // Update an existing team
  async updateTeam(id: string, teamData: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Team | null> {
    try {
      const response = await supabaseService.updateTeam(id, teamData);

      if (!response.success) {
        console.error('Error updating team:', response);
        return null;
      }

      return response.data;
    } catch (error: any) {
      console.error('Error in updateTeam:', error);
      return null;
    }
  }
  
  // Delete a team (soft delete)
  async deleteTeam(id: string): Promise<boolean> {
    try {
      // For soft delete, we'll update the team status to INACTIVE
      const response = await supabaseService.updateTeam(id, { status: 'INACTIVE' });

      if (!response.success) {
        console.error('Error deleting team:', response);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error in deleteTeam:', error);
      return false;
    }
  }
  
  // Get all players for a specific team
  async getTeamPlayers(id: string, status?: string, position?: string): Promise<Player[]> {
    try {
      // First verify the team exists
      const teamResponse = await supabaseService.getTeam(id);
      if (!teamResponse.success || !teamResponse.data) {
        throw {
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        } as ApiError;
      }

      // Get players for this team
      const filters: any = { teamId: id };

      if (status) {
        filters.status = status;
      }

      const playersResponse = await supabaseService.listPlayers(filters);

      if (!playersResponse.success) {
        throw new Error('Failed to fetch team players from database');
      }

      let teamPlayers = playersResponse.data;

      // Apply position filter if needed
      if (position) {
        teamPlayers = teamPlayers.filter((player: Player) => player.position === position);
      }

      return teamPlayers;
    } catch (error: any) {
      console.error('Error in getTeamPlayers:', error);
      throw error;
    }
  }
  
  // Add a player to a team
  async addPlayerToTeam(teamId: string, playerId: string): Promise<Player | null> {
    try {
      // Verify the team exists
      const teamResponse = await supabaseService.getTeam(teamId);
      if (!teamResponse.success || !teamResponse.data) {
        throw {
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        } as ApiError;
      }

      // Verify the player exists
      const playerResponse = await supabaseService.getPlayer(playerId);
      if (!playerResponse.success || !playerResponse.data) {
        throw {
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found'
          }
        } as ApiError;
      }

      // Update player's teamId
      const updateResponse = await supabaseService.updatePlayer(playerId, { teamId });

      if (!updateResponse.success) {
        throw new Error('Failed to add player to team');
      }

      return updateResponse.data;
    } catch (error: any) {
      console.error('Error in addPlayerToTeam:', error);
      throw error;
    }
  }
  
  // Remove a player from a team
  async removePlayerFromTeam(teamId: string, playerId: string): Promise<boolean> {
    try {
      // Verify the team exists
      const teamResponse = await supabaseService.getTeam(teamId);
      if (!teamResponse.success || !teamResponse.data) {
        throw {
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        } as ApiError;
      }

      // Verify the player exists and is in this team
      const playerResponse = await supabaseService.getPlayer(playerId);
      if (!playerResponse.success || !playerResponse.data) {
        throw {
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found'
          }
        } as ApiError;
      }

      const player = playerResponse.data;
      if (player.teamId !== teamId) {
        throw {
          error: {
            code: 'PLAYER_NOT_IN_TEAM',
            message: 'Player is not part of this team'
          }
        } as ApiError;
      }

      // Remove player's teamId
      const updateResponse = await supabaseService.updatePlayer(playerId, { teamId: undefined });

      if (!updateResponse.success) {
        throw new Error('Failed to remove player from team');
      }

      return true;
    } catch (error: any) {
      console.error('Error in removePlayerFromTeam:', error);
      throw error;
    }
  }

  // Get all matches for a specific team
  async getTeamMatches(
    id: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    competitionId?: string
  ): Promise<PaginatedMatches> {
    try {
      // First verify the team exists
      const teamResponse = await supabaseService.getTeam(id);
      if (!teamResponse.success || !teamResponse.data) {
        throw {
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        } as ApiError;
      }

      // Build filters for matches query with pagination
      const filters: any = {
        page,
        limit
      };

      if (status) {
        filters.status = status;
      }

      if (competitionId) {
        filters.competitionId = competitionId;
      }

      // Use OR condition to get matches where this team is either home or away
      // Note: This is a simplified approach - in a real implementation, you might need to do two separate queries
      const matchesResponse = await supabaseService.listMatches(filters);

      if (!matchesResponse.success || !matchesResponse.data || !Array.isArray(matchesResponse.data)) {
        throw new Error('Failed to fetch team matches from database');
      }
      
      // Type assertion for the match data
      interface MatchData {
        id: string;
        home_team_id: string;
        away_team_id: string;
        [key: string]: any; // For other properties we might need
      }
      
      // Filter matches to only include those where this team is participating
      const teamMatches = (matchesResponse.data as MatchData[]).filter(match =>
        match.home_team_id === id || match.away_team_id === id
      );

      // Transform matches to match the expected interface
      const transformedMatches: Match[] = teamMatches.map((match: any) => ({
        id: match.id,
        competitionId: match.competition_id,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        venue: match.venue,
        startTime: new Date(match.match_date),
        status: match.status,
        homeScore: match.home_score,
        awayScore: match.away_score,
        sport: 'FOOTBALL' // Default to football, could be determined from competition
      }));

      // Apply pagination in memory for filtered results
      const total = transformedMatches.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedMatches = transformedMatches.slice(startIndex, startIndex + limit);

      return {
        matches: paginatedMatches,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error: any) {
      console.error('Error in getTeamMatches:', error);
      throw error;
    }
  }

  // Get team statistics
  async getTeamStats(id: string): Promise<TeamStats> {
    try {
      // First verify the team exists
      const teamResponse = await supabaseService.getTeam(id);
      if (!teamResponse.success || !teamResponse.data) {
        throw {
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        } as ApiError;
      }

      // Get all matches for this team
      const { data: matches, error: matchesError } = await supabase
        .from('Match')
        .select('*')
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
        .eq('status', 'COMPLETED');

      if (matchesError) {
        console.error('Error fetching team matches for stats:', matchesError);
        // Return default stats if we can't fetch matches
        return {
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          cleanSheets: 0,
          yellowCards: 0,
          redCards: 0
        };
      }

      // Calculate statistics from matches
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let cleanSheets = 0;

      matches?.forEach((match: any) => {
        const isHomeTeam = match.home_team_id === id;
        const teamScore = isHomeTeam ? match.home_score : match.away_score;
        const opponentScore = isHomeTeam ? match.away_score : match.home_score;

        // Add goals
        goalsFor += teamScore || 0;
        goalsAgainst += opponentScore || 0;

        // Determine result
        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore === opponentScore) {
          draws++;
        } else {
          losses++;
        }

        // Clean sheet (no goals conceded)
        if (opponentScore === 0) {
          cleanSheets++;
        }
      });

      // Get card statistics (if available in match events or separate table)
      // For now, we'll calculate based on some basic assumptions
      const { count: yellowCards } = await supabase
        .from('match_events')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', id)
        .eq('event_type', 'yellow_card')
        .is('deleted_at', null);

      const { count: redCards } = await supabase
        .from('match_events')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', id)
        .eq('event_type', 'red_card')
        .is('deleted_at', null);

      return {
        matchesPlayed: matches?.length || 0,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        cleanSheets,
        yellowCards: yellowCards || 0,
        redCards: redCards || 0
      };
    } catch (error: any) {
      console.error('Error in getTeamStats:', error);
      throw error;
    }
  }

  // Get all competitions a team is participating in
  async getTeamCompetitions(id: string): Promise<Competition[]> {
    try {
      // First verify the team exists
      const teamResponse = await supabaseService.getTeam(id);
      if (!teamResponse.success || !teamResponse.data) {
        throw {
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        } as ApiError;
      }

      // Get all matches where this team is participating (either as home or away team)
      const { data: matches, error: matchesError } = await supabase
        .from('Match')
        .select(`
          competition_id,
          competition:Competition (*)
        `)
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`);

      if (matchesError) {
        throw new Error(`Failed to fetch team matches: ${matchesError.message}`);
      }

      // Extract unique competitions from matches
      const competitionsMap = new Map<string, Competition>();
      matches.forEach((match: any) => {
        if (match.competition && !competitionsMap.has(match.competition.id)) {
          competitionsMap.set(match.competition.id, {
            id: match.competition.id,
            name: match.competition.name,
            description: match.competition.description,
            sport: match.competition.sport?.toUpperCase() as 'FOOTBALL' | 'BASKETBALL' | 'TRACK',
            startDate: new Date(match.competition.start_date),
            endDate: new Date(match.competition.end_date),
            status: match.competition.status?.toUpperCase() as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
            organizerId: match.competition.created_by,
            createdAt: new Date(match.competition.created_at),
            updatedAt: new Date(match.competition.updated_at)
          });
        }
      });

      // Convert map values to array
      return Array.from(competitionsMap.values());
    } catch (error: any) {
      console.error('Error in getTeamCompetitions:', error);
      throw error;
    }
  }

  // Advanced search for teams
  async searchTeams(
    query?: string,
    sports?: string[],
    countries?: string[],
    minFoundedYear?: number,
    maxFoundedYear?: number
  ): Promise<{ teams: Team[]; count: number }> {
    try {
      // Build filters for the search
      const filters: any = {};

      if (query) {
        filters.name = query;
      }

      // Fetch teams from database with basic filters
      const response = await supabaseService.listTeams(filters);

      if (!response.success) {
        throw new Error('Failed to fetch teams from database');
      }

      let filteredTeams = response.data;

      // Apply additional filters in memory
      if (sports && sports.length > 0) {
        filteredTeams = filteredTeams.filter((team: Team) => sports.includes(team.sport));
      }

      if (countries && countries.length > 0) {
        filteredTeams = filteredTeams.filter((team: Team) => countries.includes(team.country));
      }

      // Apply founded year filters
      if (minFoundedYear !== undefined) {
        filteredTeams = filteredTeams.filter((team: Team) =>
          team.foundedYear !== undefined && team.foundedYear >= minFoundedYear
        );
      }

      if (maxFoundedYear !== undefined) {
        filteredTeams = filteredTeams.filter((team: Team) =>
          team.foundedYear !== undefined && team.foundedYear <= maxFoundedYear
        );
      }

      return {
        teams: filteredTeams,
        count: filteredTeams.length
      };
    } catch (error: any) {
      console.error('Error in searchTeams:', error);
      throw error;
    }
  }
}