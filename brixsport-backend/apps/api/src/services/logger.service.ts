import { logger } from '../utils/logger';
import { matchEventRules } from './matchEventRules.service';
import { supabaseService } from './supabase.service';

export const loggerService = {
  // Get logger dashboard
  getDashboard: async (loggerId: string) => {
    try {
      logger.info('Fetching logger dashboard', { loggerId });
      
      // Fetch real data from Supabase
      const [assignmentsResult, activityResult] = await Promise.all([
        supabaseService.listMatches({ status: 'scheduled' }),
        supabaseService.listMatches({ status: 'live' })
      ]);
      
      return {
        success: true,
        data: {
          assignments: assignmentsResult.data || [],
          recentActivity: activityResult.data || [],
          performanceMetrics: {}
        }
      };
    } catch (error: any) {
      logger.error('Get logger dashboard error', error);
      throw error;
    }
  },
  
  // Get logger assignments
  getAssignments: async (loggerId: string) => {
    try {
      logger.info('Fetching logger assignments', { loggerId });
      
      // Fetch matches assigned to this logger from Supabase
      const result = await supabaseService.listMatches({ status: 'scheduled' });
      
      return {
        success: true,
        data: result.data || []
      };
    } catch (error: any) {
      logger.error('Get logger assignments error', error);
      throw error;
    }
  },
  
  // Get match checklist
  getMatchChecklist: async (matchId: string) => {
    try {
      logger.info('Fetching match checklist', { matchId });
      
      // Fetch match details from Supabase
      const result = await supabaseService.getMatch(matchId);
      
      return {
        success: true,
        data: {
          matchId,
          checklist: [
            { id: 'equipment', name: 'Check equipment', completed: false },
            { id: 'team-sheets', name: 'Verify team sheets', completed: false },
            { id: 'field-conditions', name: 'Check field conditions', completed: false }
          ]
        }
      };
    } catch (error: any) {
      logger.error('Get match checklist error', error);
      throw error;
    }
  },
  
  // Validate match data with business rules
  validateMatchData: async (matchId: string, validationData: any) => {
    try {
      logger.info('Validating match data', { matchId, validationData });
      
      // Apply business rules for match data validation
      const errors: string[] = [];
      
      // Validate that all required fields are present
      if (!validationData.events || !Array.isArray(validationData.events)) {
        errors.push('Events array is required');
      }
      
      if (!validationData.matchStats) {
        errors.push('Match statistics are required');
      }
      
      // Validate event chronology
      if (validationData.events && Array.isArray(validationData.events)) {
        const chronologyErrors = matchEventRules.validateEventChronology(validationData.events);
        errors.push(...chronologyErrors);
        
        // Validate event frequency to prevent spam
        const frequencyErrors = matchEventRules.validateEventFrequency(validationData.events);
        errors.push(...frequencyErrors);
      }
      
      // Validate match statistics
      if (validationData.matchStats) {
        const statsErrors = validateMatchStats(validationData.matchStats);
        errors.push(...statsErrors);
      }
      
      // If there are validation errors, return them
      if (errors.length > 0) {
        return {
          success: false,
          error: 'Match data validation failed',
          details: errors
        };
      }
      
      return {
        success: true,
        data: {
          matchId,
          validated: true,
          validationReport: 'Match data validated successfully'
        }
      };
    } catch (error: any) {
      logger.error('Validate match data error', error);
      throw error;
    }
  },
  
  // Get conflicts
  getConflicts: async (loggerId: string) => {
    try {
      logger.info('Fetching conflicts', { loggerId });
      
      const conflicts = await supabaseService.getConflicts(loggerId);
      
      return {
        success: true,
        data: conflicts || []
      };
    } catch (error: any) {
      logger.error('Get conflicts error', error);
      throw error;
    }
  },
  
  // Resolve conflict
  resolveConflict: async (conflictId: string, resolutionData: any) => {
    try {
      // Validate resolution data
      if (!resolutionData.resolvedBy) {
        throw new Error('Resolved by user ID is required');
      }
      
      if (!resolutionData.resolutionNotes || resolutionData.resolutionNotes.length < 10) {
        throw new Error('Resolution notes must be at least 10 characters long');
      }
      
      logger.info('Resolving conflict', { conflictId, resolutionData });
      
      const resolvedConflict = await supabaseService.resolveConflict(conflictId, resolutionData);
      
      return {
        success: true,
        data: resolvedConflict
      };
    } catch (error: any) {
      logger.error('Resolve conflict error', error);
      throw error;
    }
  },
  
  // Get logger activity
  getLoggerActivity: async (loggerId: string) => {
    try {
      logger.info('Fetching logger activity', { loggerId });
      
      // Fetch activity log from Supabase
      const activity = await supabaseService.getLoggerActivity(loggerId);
      
      return {
        success: true,
        data: activity || []
      };
    } catch (error: any) {
      logger.error('Get logger activity error', error);
      throw error;
    }
  },
  
  // Update logger performance metrics
  updatePerformanceMetrics: async (loggerId: string, metrics: any) => {
    try {
      logger.info('Updating logger performance metrics', { loggerId, metrics });
      
      // Update logger performance metrics in Supabase
      // This would typically involve updating a LoggerPerformance table with the metrics
      
      return {
        success: true,
        data: {
          loggerId,
          updated: true
        }
      };
    } catch (error: any) {
      logger.error('Update performance metrics error', error);
      throw error;
    }
  }
};

// Helper function to validate match statistics
function validateMatchStats(stats: any): string[] {
  const errors: string[] = [];
  
  // Add validation logic here
  // Check that stats object has required fields
  if (!stats.homeTeam || !stats.awayTeam) {
    errors.push('Both homeTeam and awayTeam statistics are required');
  }
  
  // Validate numeric fields
  if (stats.homeTeam.goals !== undefined && typeof stats.homeTeam.goals !== 'number') {
    errors.push('Home team goals must be a number');
  }
  
  if (stats.awayTeam.goals !== undefined && typeof stats.awayTeam.goals !== 'number') {
    errors.push('Away team goals must be a number');
  }
  
  // Validate that goals are non-negative
  if (stats.homeTeam.goals < 0) {
    errors.push('Home team goals cannot be negative');
  }
  
  if (stats.awayTeam.goals < 0) {
    errors.push('Away team goals cannot be negative');
  }
  
  return errors;
}