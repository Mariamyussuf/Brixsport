/**
 * Basketball Schedule Cache Warming Strategy
 * Pre-loads frequently accessed basketball schedule data into cache
 */

import { enhancedRedisService } from './enhanced-redis.service';
import { logger } from '../utils/logger';
import { supabase } from './supabase.service';

export class BasketballScheduleWarming {
  /**
   * Warm up the full basketball schedule
   */
  static async warmFullSchedule(): Promise<void> {
    try {
      logger.info('Warming full basketball schedule cache');
      
      // Fetch the complete schedule from database
      const { data: schedule, error } = await supabase
        .from('basketball_schedule')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch basketball schedule: ${error.message}`);
      }
      
      // Cache the full schedule
      await enhancedRedisService.set('basketball:schedule:full', schedule, 1800); // 30 minutes
      
      // Cache individual rounds
      const rounds = new Map<number, any[]>();
      schedule.forEach(match => {
        if (!rounds.has(match.round)) {
          rounds.set(match.round, []);
        }
        rounds.get(match.round)!.push(match);
      });
      
      for (const [round, matches] of rounds) {
        await enhancedRedisService.set(`basketball:schedule:round:${round}`, matches, 1800);
      }
      
      logger.info(`Warmed basketball schedule with ${schedule.length} matches across ${rounds.size} rounds`);
    } catch (error) {
      logger.error('Failed to warm basketball schedule:', error);
      throw error;
    }
  }

  /**
   * Warm up upcoming matches
   */
  static async warmUpcomingMatches(hours: number = 24): Promise<void> {
    try {
      logger.info(`Warming upcoming basketball matches (${hours} hours)`);
      
      const now = new Date();
      const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      // Fetch upcoming matches
      const { data: matches, error } = await supabase
        .from('basketball_schedule')
        .select('*')
        .gte('date', now.toISOString())
        .lte('date', future.toISOString())
        .order('date', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch upcoming matches: ${error.message}`);
      }
      
      // Cache upcoming matches
      await enhancedRedisService.set('basketball:matches:upcoming', matches, 900); // 15 minutes
      
      logger.info(`Warmed ${matches.length} upcoming basketball matches`);
    } catch (error) {
      logger.error('Failed to warm upcoming matches:', error);
      throw error;
    }
  }

  /**
   * Warm up team-specific schedules
   */
  static async warmTeamSchedules(): Promise<void> {
    try {
      logger.info('Warming team-specific basketball schedules');
      
      // Get all unique teams
      const { data: teams, error: teamsError } = await supabase
        .from('basketball_schedule')
        .select('home_team, away_team')
        .order('date', { ascending: true });
      
      if (teamsError) {
        throw new Error(`Failed to fetch teams: ${teamsError.message}`);
      }
      
      // Extract unique team IDs
      const teamIds = new Set<string>();
      teams.forEach(match => {
        teamIds.add(match.home_team);
        teamIds.add(match.away_team);
      });
      
      // Warm each team's schedule
      for (const teamId of teamIds) {
        const { data: teamMatches, error: matchesError } = await supabase
          .from('basketball_schedule')
          .select('*')
          .or(`home_team.eq.${teamId},away_team.eq.${teamId}`)
          .order('date', { ascending: true });
        
        if (matchesError) {
          logger.warn(`Failed to fetch schedule for team ${teamId}: ${matchesError.message}`);
          continue;
        }
        
        await enhancedRedisService.set(`basketball:team:${teamId}:schedule`, teamMatches, 1800);
      }
      
      logger.info(`Warmed schedules for ${teamIds.size} basketball teams`);
    } catch (error) {
      logger.error('Failed to warm team schedules:', error);
      throw error;
    }
  }

  /**
   * Warm up popular matches based on historical views
   */
  static async warmPopularMatches(): Promise<void> {
    try {
      logger.info('Warming popular basketball matches');
      
      // In a real implementation, this would use analytics data
      // For now, we'll warm matches from the current round
      const { data: currentRound, error: roundError } = await supabase
        .from('basketball_schedule')
        .select('round')
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      if (roundError) {
        throw new Error(`Failed to fetch current round: ${roundError.message}`);
      }
      
      // Fetch matches from current round
      const { data: matches, error: matchesError } = await supabase
        .from('basketball_schedule')
        .select('*')
        .eq('round', currentRound.round)
        .order('date', { ascending: true });
      
      if (matchesError) {
        throw new Error(`Failed to fetch current round matches: ${matchesError.message}`);
      }
      
      // Cache current round matches
      await enhancedRedisService.set('basketball:matches:current-round', matches, 1200); // 20 minutes
      
      logger.info(`Warmed ${matches.length} matches from round ${currentRound.round}`);
    } catch (error) {
      logger.error('Failed to warm popular matches:', error);
      throw error;
    }
  }

  /**
   * Warm all basketball-related caches
   */
  static async warmAll(): Promise<void> {
    try {
      logger.info('Starting basketball schedule cache warming');
      
      await Promise.all([
        this.warmFullSchedule(),
        this.warmUpcomingMatches(),
        this.warmTeamSchedules(),
        this.warmPopularMatches()
      ]);
      
      logger.info('Basketball schedule cache warming completed');
    } catch (error) {
      logger.error('Basketball schedule cache warming failed:', error);
      throw error;
    }
  }
}

export default BasketballScheduleWarming;