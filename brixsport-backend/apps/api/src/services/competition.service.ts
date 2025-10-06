import { logger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';
import {
  Competition,
  CompetitionTeam,
  Group,
  GroupTeam,
  GroupWithStandings,
  KnockoutStage,
  CompetitionStanding,
  CompetitionStatistics,
  CompetitionMatch,
  CompetitionTimelineEvent,
  GroupStanding
} from '../types/competition.types';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError
} from './error.handler.service';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are not configured properly');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const competitionService = {
  listCompetitions: async (filters: {
    status?: string;
    type?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    try {
      logger.info('Listing competitions', { filters });

      let query = supabase
        .from('Competition')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (typeof filters.limit === 'number' && typeof filters.offset === 'number') {
        query = query.range(filters.offset, filters.offset + filters.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new AppError(`Failed to list competitions: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        meta: {
          total: count ?? data?.length ?? 0,
          limit: filters.limit ?? data?.length ?? 0,
          offset: filters.offset ?? 0
        }
      };
    } catch (error: any) {
      logger.error('List competitions error', { error: error.message, stack: error.stack });
      return {
        success: false,
        error: error.message || 'Failed to list competitions'
      };
    }
  },

  createCompetition: async (data: any, userId: string) => {
    try {
      logger.info('Creating competition', { data, userId });

      if (!data?.name || !data?.sport || !data?.type || !data?.start_date || !data?.end_date) {
        throw new ValidationError('Missing required fields: name, sport, type, start_date, end_date');
      }

      const competitionPayload = {
        name: data.name,
        description: data.description || '',
        sport: data.sport,
        type: data.type,
        category: data.category || 'school',
        status: 'draft',
        start_date: data.start_date,
        end_date: data.end_date,
        registration_deadline: data.registration_deadline || data.start_date,
        max_teams: data.max_teams || 0,
        current_teams: 0,
        format: data.format || 'group_knockout',
        prize_pool: data.prize_pool || 0,
        entry_fee: data.entry_fee || 0,
        organizer: data.organizer || '',
        location: data.location || '',
        rules: data.rules || '',
        has_group_stage: data.has_group_stage ?? false,
        groups: data.groups || 0,
        teams_per_group: data.teams_per_group || 0,
        advance_per_group: data.advance_per_group || 0,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('Competition')
        .insert(competitionPayload)
        .select()
        .single();

      if (error) {
        throw new AppError(`Failed to create competition: ${error.message}`);
      }

      logger.info('Competition created successfully', { competitionId: result.id });
      return result;
    } catch (error: any) {
      logger.error('Create competition error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // Get competition by ID
  getCompetitionById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('Competition')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new AppError(`Failed to get competition: ${error.message}`);
      }
      
      return data || null;
    } catch (error: any) {
      logger.error('Get competition by ID error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // Check if user has admin permission
  hasAdminPermission: async (userId: string, competitionId: string) => {
    try {
      // Check if user is the creator of the competition
      const { data, error } = await supabase
        .from('Competition')
        .select('created_by')
        .eq('id', competitionId)
        .single();
      
      if (error) {
        throw new AppError(`Failed to check permission: ${error.message}`);
      }
      
      return data.created_by === userId;
    } catch (error: any) {
      logger.error('Permission check error', { error: error.message, stack: error.stack });
      return false;
    }
  },

  // 1. Start Registration Phase
  startRegistration: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can start registration');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition is in draft status
      if (competition.status !== 'draft') {
        throw new ConflictError('Competition must be in draft status to start registration');
      }
      
      // Update competition status
      const { data, error } = await supabase
        .from('Competition')
        .update({ status: 'registration', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to start registration: ${error.message}`);
      }
      
      logger.info('Registration started successfully', { competitionId: id });
      return data;
    } catch (error: any) {
      logger.error('Start registration error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 2. Add Team to Competition (During Registration)
  addTeamToCompetition: async (id: string, teamId: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can add teams');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition is in registration status
      if (competition.status !== 'registration') {
        throw new ConflictError('Competition must be in registration status to add teams');
      }
      
      // Check if team already added
      const { data: existingTeam } = await supabase
        .from('CompetitionTeam')
        .select('*')
        .eq('competition_id', id)
        .eq('team_id', teamId)
        .single();
      
      if (existingTeam) {
        throw new ConflictError('Team already added to competition');
      }
      
      // Check if max teams limit reached
      if (competition.max_teams > 0 && competition.current_teams >= competition.max_teams) {
        throw new ConflictError('Maximum number of teams reached for this competition');
      }
      
      // Get team details
      const { data: team, error: teamError } = await supabase
        .from('Team')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (teamError) {
        throw new NotFoundError('Team not found');
      }
      
      // Add team to competition
      const { data: competitionTeam, error: addError } = await supabase
        .from('CompetitionTeam')
        .insert({
          competition_id: id,
          team_id: teamId,
          added_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (addError) {
        throw new AppError(`Failed to add team to competition: ${addError.message}`);
      }
      
      // Update competition team count
      const { error: updateError } = await supabase
        .from('Competition')
        .update({ 
          current_teams: competition.current_teams + 1,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (updateError) {
        logger.error('Failed to update competition team count', { error: updateError.message });
      }
      
      logger.info('Team added to competition successfully', { competitionId: id, teamId });
      return competitionTeam;
    } catch (error: any) {
      logger.error('Add team to competition error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 3. Generate Groups (After Registration)
  generateGroups: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can generate groups');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition has group stage
      if (!competition.has_group_stage) {
        throw new ValidationError('Competition does not have group stage');
      }
      
      // Check if competition is in registration status
      if (competition.status !== 'registration') {
        throw new ConflictError('Competition must be in registration status to generate groups');
      }
      
      // Get teams in competition
      const { data: teams, error: teamsError } = await supabase
        .from('CompetitionTeam')
        .select(`
          id,
          team_id,
          team:Team (*)
        `)
        .eq('competition_id', id);
      
      if (teamsError) {
        throw new AppError(`Failed to get competition teams: ${teamsError.message}`);
      }
      
      // Check if enough teams for groups
      if (teams.length < (competition.groups! * competition.teams_per_group!)) {
        throw new ValidationError('Not enough teams registered for the configured group structure');
      }
      
      // Generate groups
      const groups: any[] = [];
      const teamsArray = [...teams]; // Copy array to avoid mutation
      
      // Shuffle teams randomly
      for (let i = teamsArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teamsArray[i], teamsArray[j]] = [teamsArray[j], teamsArray[i]];
      }
      
      // Distribute teams to groups
      for (let i = 0; i < competition.groups!; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, etc.
        const groupTeams = teamsArray.slice(
          i * competition.teams_per_group!, 
          (i + 1) * competition.teams_per_group!
        );
        
        // Create group
        const { data: group, error: groupError } = await supabase
          .from('Group')
          .insert({
            competition_id: id,
            name: groupName
          })
          .select()
          .single();
        
        if (groupError) {
          throw new AppError(`Failed to create group: ${groupError.message}`);
        }
        
        // Add teams to group
        for (const team of groupTeams) {
          const { error: groupTeamError } = await supabase
            .from('GroupTeam')
            .insert({
              group_id: group.id,
              team_id: team.team_id
            });
          
          if (groupTeamError) {
            throw new AppError(`Failed to add team to group: ${groupTeamError.message}`);
          }
        }
        
        groups.push({
          id: group.id,
          name: groupName,
          teams: groupTeams
        });
      }
      
      // Update competition status
      const { error: updateError } = await supabase
        .from('Competition')
        .update({ 
          status: 'group_stage',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (updateError) {
        throw new AppError(`Failed to update competition status: ${updateError.message}`);
      }
      
      logger.info('Groups generated successfully', { competitionId: id });
      return groups;
    } catch (error: any) {
      logger.error('Generate groups error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 4. Get Competition Groups
  getCompetitionGroups: async (id: string) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Get groups with teams
      const { data: groups, error } = await supabase
        .from('Group')
        .select(`
          id,
          name,
          group_teams:GroupTeam (
            id,
            team:Team (*)
          )
        `)
        .eq('competition_id', id);
      
      if (error) {
        throw new AppError(`Failed to get competition groups: ${error.message}`);
      }
      
      return groups.map(group => ({
        id: group.id,
        competition_id: id,
        name: group.name,
        teams: group.group_teams.map((gt: any) => ({
          id: gt.id,
          group_id: group.id,
          team_id: gt.team.id,
          team: gt.team
        }))
      }));
    } catch (error: any) {
      logger.error('Get competition groups error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 5. Generate Group Stage Fixtures
  generateGroupFixtures: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can generate fixtures');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition has group stage
      if (!competition.has_group_stage) {
        throw new ValidationError('Competition does not have group stage');
      }
      
      // Check if competition is in group stage status
      if (competition.status !== 'group_stage') {
        throw new ConflictError('Competition must be in group stage status to generate fixtures');
      }
      
      // Get groups with teams
      const groups = await competitionService.getCompetitionGroups(id);
      
      // Generate fixtures for each group (round-robin)
      const fixtures: any[] = [];
      
      for (const group of groups) {
        const teams = group.teams;
        const numTeams = teams.length;
        
        // Generate round-robin fixtures
        for (let i = 0; i < numTeams; i++) {
          for (let j = i + 1; j < numTeams; j++) {
            const homeTeam = teams[i];
            const awayTeam = teams[j];
            
            // Create match
            const { data: match, error: matchError } = await supabase
              .from('Match')
              .insert({
                competition_id: id,
                stage: 'group_stage',
                group_id: group.id,
                home_team_id: homeTeam.team_id,
                away_team_id: awayTeam.team_id,
                home_team_name: homeTeam.team.name,
                away_team_name: awayTeam.team.name,
                home_team_logo: homeTeam.team.logo,
                away_team_logo: awayTeam.team.logo,
                match_date: new Date().toISOString(), // Placeholder date
                venue: competition.location,
                status: 'scheduled'
              })
              .select()
              .single();
            
            if (matchError) {
              throw new AppError(`Failed to create match: ${matchError.message}`);
            }
            
            fixtures.push(match);
          }
        }
      }
      
      logger.info('Group stage fixtures generated successfully', { competitionId: id });
      return fixtures;
    } catch (error: any) {
      logger.error('Generate group fixtures error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 6. Start Group Stage
  startGroupStage: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can start group stage');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition has group stage
      if (!competition.has_group_stage) {
        throw new ValidationError('Competition does not have group stage');
      }
      
      // Check if competition is in group stage status
      if (competition.status !== 'group_stage') {
        throw new ConflictError('Competition must be in group stage status to start group stage');
      }
      
      // Update competition status
      const { data, error } = await supabase
        .from('Competition')
        .update({ 
          status: 'group_stage',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to start group stage: ${error.message}`);
      }
      
      logger.info('Group stage started successfully', { competitionId: id });
      return data;
    } catch (error: any) {
      logger.error('Start group stage error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 7. Get Group Standings
  getGroupStandings: async (id: string) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Get groups with teams
      const groups = await competitionService.getCompetitionGroups(id);
      
      // Calculate standings for each group
      const standings: GroupWithStandings[] = [];
      
      for (const group of groups) {
        // Get matches for this group
        const { data: matches, error: matchesError } = await supabase
          .from('Match')
          .select('*')
          .eq('group_id', group.id)
          .eq('status', 'completed');
        
        if (matchesError) {
          throw new AppError(`Failed to get group matches: ${matchesError.message}`);
        }
        
        // Calculate standings
        const teamStats: Record<string, GroupStanding> = {};
        
        // Initialize stats for all teams
        for (const groupTeam of group.teams) {
          teamStats[groupTeam.team_id] = {
            team_id: groupTeam.team_id,
            team_name: groupTeam.team.name,
            team_logo: groupTeam.team.logo,
            position: 0,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0
          };
        }
        
        // Update stats based on matches
        for (const match of matches) {
          // Update home team stats
          const homeStats = teamStats[match.home_team_id];
          if (homeStats) {
            homeStats.played += 1;
            homeStats.goals_for += match.home_score || 0;
            homeStats.goals_against += match.away_score || 0;
            homeStats.goal_difference = homeStats.goals_for - homeStats.goals_against;
            
            if (match.home_score! > match.away_score!) {
              homeStats.won += 1;
              homeStats.points += 3;
            } else if (match.home_score === match.away_score) {
              homeStats.drawn += 1;
              homeStats.points += 1;
            } else {
              homeStats.lost += 1;
            }
          }
          
          // Update away team stats
          const awayStats = teamStats[match.away_team_id];
          if (awayStats) {
            awayStats.played += 1;
            awayStats.goals_for += match.away_score || 0;
            awayStats.goals_against += match.home_score || 0;
            awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against;
            
            if (match.away_score! > match.home_score!) {
              awayStats.won += 1;
              awayStats.points += 3;
            } else if (match.away_score === match.home_score) {
              awayStats.drawn += 1;
              awayStats.points += 1;
            } else {
              awayStats.lost += 1;
            }
          }
        }
        
        // Sort standings by points, goal difference, goals for
        const sortedStandings = Object.values(teamStats).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
          return b.goals_for - a.goals_for;
        });
        
        // Add positions
        sortedStandings.forEach((standing, index) => {
          standing.position = index + 1;
        });
        
        standings.push({
          group_id: group.id,
          group_name: group.name,
          standings: sortedStandings
        });
      }
      
      return standings;
    } catch (error: any) {
      logger.error('Get group standings error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 8. Determine Knockout Stage Teams
  determineKnockoutTeams: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can determine knockout teams');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition has group stage
      if (!competition.has_group_stage) {
        throw new ValidationError('Competition does not have group stage');
      }
      
      // Get group standings
      const standings = await competitionService.getGroupStandings(id);
      
      // Determine teams advancing to knockout stage
      const advancingTeams: any[] = [];
      
      for (const groupStandings of standings) {
        // Get top teams from each group
        const topTeams = groupStandings.standings.slice(0, competition.advance_per_group || 2);
        advancingTeams.push(...topTeams);
      }
      
      logger.info('Knockout stage teams determined successfully', { 
        competitionId: id, 
        teamsCount: advancingTeams.length 
      });
      
      return {
        advancing_teams: advancingTeams,
        count: advancingTeams.length
      };
    } catch (error: any) {
      logger.error('Determine knockout teams error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 9. Generate Knockout Stage Fixtures
  generateKnockoutFixtures: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can generate knockout fixtures');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Check if competition is ready for knockout stage
      if (competition.status !== 'group_stage') {
        throw new ConflictError('Competition must complete group stage before generating knockout fixtures');
      }
      
      // Get advancing teams
      const { advancing_teams: advancingTeams } = await competitionService.determineKnockoutTeams(id, userId);
      
      // Generate knockout stage structure
      const knockoutStage: KnockoutStage = {
        round_of_16: [],
        quarter_finals: [],
        semi_finals: [],
        final: {
          match_id: '',
          home_team: {
            team_id: '',
            team_name: 'TBD',
            source: 'semi_final_1_winner'
          },
          away_team: {
            team_id: '',
            team_name: 'TBD',
            source: 'semi_final_2_winner'
          },
          match_date: '',
          venue: competition.location,
          status: 'scheduled'
        }
      };
      
      // Generate round of 16 matches (placeholder)
      for (let i = 0; i < Math.min(advancingTeams.length, 16); i += 2) {
        if (i + 1 < advancingTeams.length) {
          const match = {
            match_id: `match_${Date.now()}_${i}`,
            home_team: {
              team_id: advancingTeams[i].team_id,
              team_name: advancingTeams[i].team_name,
              team_logo: advancingTeams[i].team_logo,
              source: `group_${advancingTeams[i].group_name}_${advancingTeams[i].position}`
            },
            away_team: {
              team_id: advancingTeams[i + 1].team_id,
              team_name: advancingTeams[i + 1].team_name,
              team_logo: advancingTeams[i + 1].team_logo,
              source: `group_${advancingTeams[i + 1].group_name}_${advancingTeams[i + 1].position}`
            },
            match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            venue: competition.location,
            status: 'scheduled' as const
          };
          
          knockoutStage.round_of_16.push(match);
        }
      }
      
      // Create matches in database
      for (const match of knockoutStage.round_of_16) {
        const { error: matchError } = await supabase
          .from('Match')
          .insert({
            competition_id: id,
            stage: 'knockout',
            round: 'round_of_16',
            home_team_id: match.home_team.team_id || null,
            away_team_id: match.away_team.team_id || null,
            home_team_name: match.home_team.team_name,
            away_team_name: match.away_team.team_name,
            home_team_logo: match.home_team.team_logo,
            away_team_logo: match.away_team.team_logo,
            match_date: match.match_date,
            venue: match.venue,
            status: match.status
          });
        
        if (matchError) {
          throw new AppError(`Failed to create knockout match: ${matchError.message}`);
        }
      }
      
      logger.info('Knockout stage fixtures generated successfully', { competitionId: id });
      return knockoutStage;
    } catch (error: any) {
      logger.error('Generate knockout fixtures error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 10. Start Knockout Stage
  startKnockoutStage: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can start knockout stage');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Update competition status
      const { data, error } = await supabase
        .from('Competition')
        .update({ 
          status: 'knockout',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to start knockout stage: ${error.message}`);
      }
      
      logger.info('Knockout stage started successfully', { competitionId: id });
      return data;
    } catch (error: any) {
      logger.error('Start knockout stage error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 11. Get Knockout Stage Structure
  getKnockoutStructure: async (id: string) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Get knockout matches
      const { data: matches, error } = await supabase
        .from('Match')
        .select('*')
        .eq('competition_id', id)
        .eq('stage', 'knockout')
        .order('round');
      
      if (error) {
        throw new AppError(`Failed to get knockout matches: ${error.message}`);
      }
      
      // Organize matches by round
      const knockoutStage: any = {
        round_of_16: [],
        quarter_finals: [],
        semi_finals: [],
        final: null
      };
      
      for (const match of matches) {
        switch (match.round) {
          case 'round_of_16':
            knockoutStage.round_of_16.push(match);
            break;
          case 'quarter_finals':
            knockoutStage.quarter_finals.push(match);
            break;
          case 'semi_finals':
            knockoutStage.semi_finals.push(match);
            break;
          case 'final':
            knockoutStage.final = match;
            break;
        }
      }
      
      return knockoutStage;
    } catch (error: any) {
      logger.error('Get knockout structure error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 12. Complete Competition
  completeCompetition: async (id: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can complete competition');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Update competition status
      const { data, error } = await supabase
        .from('Competition')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to complete competition: ${error.message}`);
      }
      
      logger.info('Competition completed successfully', { competitionId: id });
      return data;
    } catch (error: any) {
      logger.error('Complete competition error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 13. Get Competition Final Standings
  getFinalStandings: async (id: string) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // For now, return group standings as final standings
      // In a real implementation, this would combine group stage and knockout stage results
      const groupStandings = await competitionService.getGroupStandings(id);
      
      // Flatten standings
      const standings: CompetitionStanding[] = [];
      
      groupStandings.forEach(group => {
        group.standings.forEach((standing, index) => {
          standings.push({
            position: standing.position,
            team_id: standing.team_id,
            team_name: standing.team_name,
            team_logo: standing.team_logo,
            group_stage: {
              group: group.group_name,
              group_position: standing.position,
              points: standing.points,
              goals_for: standing.goals_for,
              goals_against: standing.goals_against
            },
            knockout_stage: {
              round_reached: 'round_of_16',
              matches_played: standing.played,
              wins: standing.won
            }
          });
        });
      });
      
      // Sort by group stage points
      standings.sort((a, b) => {
        return b.group_stage.points - a.group_stage.points;
      });
      
      return standings;
    } catch (error: any) {
      logger.error('Get final standings error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 14. Cancel Competition
  cancelCompetition: async (id: string, reason: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can cancel competition');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Update competition status
      const { data, error } = await supabase
        .from('Competition')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to cancel competition: ${error.message}`);
      }
      
      // Log cancellation reason
      const { error: logError } = await supabase
        .from('CompetitionCancellation')
        .insert({
          competition_id: id,
          reason: reason,
          cancelled_by: userId,
          cancelled_at: new Date().toISOString()
        });
      
      if (logError) {
        logger.error('Failed to log cancellation reason', { error: logError.message });
      }
      
      logger.info('Competition cancelled successfully', { competitionId: id });
      return data;
    } catch (error: any) {
      logger.error('Cancel competition error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 15. Get Competition Statistics
  getCompetitionStatistics: async (id: string) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Get match statistics
      const { data: matches, error: matchesError } = await supabase
        .from('Match')
        .select('*')
        .eq('competition_id', id);
      
      if (matchesError) {
        throw new AppError(`Failed to get competition matches: ${matchesError.message}`);
      }
      
      // Calculate statistics
      const stats: CompetitionStatistics = {
        total_matches: matches.length,
        completed_matches: matches.filter(m => m.status === 'completed').length,
        total_goals: matches.reduce((sum, match) => {
          return sum + (match.home_score || 0) + (match.away_score || 0);
        }, 0),
        avg_attendance: 0, // Would need attendance data
        top_scorers: [], // Would need player data
        most_clean_sheets: [] // Would need detailed match data
      };
      
      return stats;
    } catch (error: any) {
      logger.error('Get competition statistics error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 16. Get Competition Matches by Stage
  getCompetitionMatches: async (id: string, filters: any) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Build query
      let query = supabase
        .from('Match')
        .select('*')
        .eq('competition_id', id);
      
      // Apply filters
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.group_id) {
        query = query.eq('group_id', filters.group_id);
      }
      
      if (filters.round) {
        query = query.eq('round', filters.round);
      }
      
      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new AppError(`Failed to get competition matches: ${error.message}`);
      }
      
      // Convert to CompetitionMatch type
      const competitionMatches: CompetitionMatch[] = data.map(match => ({
        id: match.id,
        competition_id: match.competition_id,
        stage: match.stage,
        group_id: match.group_id,
        round: match.round,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        home_team_name: match.home_team_name,
        away_team_name: match.away_team_name,
        home_team_logo: match.home_team_logo,
        away_team_logo: match.away_team_logo,
        match_date: match.match_date,
        venue: match.venue,
        status: match.status,
        home_score: match.home_score,
        away_score: match.away_score,
        current_minute: match.current_minute,
        period: match.period
      }));
      
      return {
        data: competitionMatches,
        pagination: {
          limit: filters.limit || 10,
          offset: filters.offset || 0,
          total: data.length
        }
      };
    } catch (error: any) {
      logger.error('Get competition matches error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 17. Reschedule Match
  rescheduleMatch: async (id: string, matchId: string, newDate: string, newVenue: string | undefined, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can reschedule matches');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Update match
      const { data, error } = await supabase
        .from('Match')
        .update({ 
          match_date: newDate,
          venue: newVenue || competition.location,
          updated_at: new Date().toISOString() 
        })
        .eq('id', matchId)
        .eq('competition_id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to reschedule match: ${error.message}`);
      }
      
      logger.info('Match rescheduled successfully', { competitionId: id, matchId });
      return data;
    } catch (error: any) {
      logger.error('Reschedule match error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 18. Postpone Match
  postponeMatch: async (id: string, matchId: string, reason: string, userId: string) => {
    try {
      // Check if user has permission
      const hasPermission = await competitionService.hasAdminPermission(userId, id);
      if (!hasPermission) {
        throw new ForbiddenError('Only competition creators can postpone matches');
      }
      
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Update match status
      const { data, error } = await supabase
        .from('Match')
        .update({ 
          status: 'postponed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', matchId)
        .eq('competition_id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(`Failed to postpone match: ${error.message}`);
      }
      
      // Log postponement reason
      const { error: logError } = await supabase
        .from('MatchPostponement')
        .insert({
          match_id: matchId,
          reason: reason,
          postponed_by: userId,
          postponed_at: new Date().toISOString()
        });
      
      if (logError) {
        logger.error('Failed to log postponement reason', { error: logError.message });
      }
      
      logger.info('Match postponed successfully', { competitionId: id, matchId });
      return data;
    } catch (error: any) {
      logger.error('Postpone match error', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  // 19. Get Competition Timeline
  getCompetitionTimeline: async (id: string) => {
    try {
      // Get competition
      const competition = await competitionService.getCompetitionById(id);
      if (!competition) {
        throw new NotFoundError('Competition not found');
      }
      
      // Create timeline events
      const timeline: CompetitionTimelineEvent[] = [
        {
          date: competition.created_at,
          event: 'Competition Created',
          description: `Competition "${competition.name}" was created`,
          type: 'milestone'
        },
        {
          date: competition.start_date,
          event: 'Competition Start Date',
          description: `Competition is scheduled to begin`,
          type: 'milestone'
        },
        {
          date: competition.end_date,
          event: 'Competition End Date',
          description: `Competition is scheduled to end`,
          type: 'milestone'
        }
      ];
      
      // Add registration deadline if it exists
      if (competition.registration_deadline) {
        timeline.push({
          date: competition.registration_deadline,
          event: 'Registration Deadline',
          description: `Registration for the competition closes`,
          type: 'milestone'
        });
      }
      
      // Get matches to add to timeline
      const { data: matches, error: matchesError } = await supabase
        .from('Match')
        .select('*')
        .eq('competition_id', id)
        .order('match_date', { ascending: true });
      
      if (matchesError) {
        throw new AppError(`Failed to get competition matches: ${matchesError.message}`);
      }
      
      // Add match events to timeline
      matches.forEach(match => {
        timeline.push({
          date: match.match_date,
          event: `${match.home_team_name} vs ${match.away_team_name}`,
          description: `Match in ${match.stage}${match.group_id ? ` Group ${match.group_id}` : ''}`,
          type: 'match'
        });
      });
      
      // Sort timeline by date
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return timeline;
    } catch (error: any) {
      logger.error('Get competition timeline error', { error: error.message, stack: error.stack });
      throw error;
    }
  }
};