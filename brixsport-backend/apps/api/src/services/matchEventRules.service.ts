import { logger } from '../utils/logger';

// Business rules for match events
export const matchEventRules = {
  // Validate that a goal event has required data
  validateGoalEvent: (eventData: any) => {
    const errors: string[] = [];
    
    if (!eventData.playerId) {
      errors.push('Player ID is required for goal events');
    }
    
    if (typeof eventData.timestamp !== 'number' || eventData.timestamp < 0) {
      errors.push('Valid timestamp is required for goal events');
    }
    
    // For penalty goals, additional validation
    if (eventData.additionalData?.penalty && !eventData.additionalData.penaltyOutcome) {
      errors.push('Penalty outcome is required for penalty goals');
    }
    
    return errors;
  },
  
  // Validate that a card event has required data
  validateCardEvent: (eventData: any) => {
    const errors: string[] = [];
    
    if (!eventData.playerId) {
      errors.push('Player ID is required for card events');
    }
    
    if (!eventData.eventType || !['yellow_card', 'red_card'].includes(eventData.eventType)) {
      errors.push('Invalid card type');
    }
    
    if (typeof eventData.timestamp !== 'number' || eventData.timestamp < 0) {
      errors.push('Valid timestamp is required for card events');
    }
    
    // Red cards require a reason
    if (eventData.eventType === 'red_card' && !eventData.additionalData?.reason) {
      errors.push('Reason is required for red cards');
    }
    
    return errors;
  },
  
  // Validate that a substitution event has required data
  validateSubstitutionEvent: (eventData: any) => {
    const errors: string[] = [];
    
    if (!eventData.teamId) {
      errors.push('Team ID is required for substitution events');
    }
    
    if (!eventData.additionalData?.outgoingPlayerId) {
      errors.push('Outgoing player ID is required for substitution events');
    }
    
    if (!eventData.additionalData?.incomingPlayerId) {
      errors.push('Incoming player ID is required for substitution events');
    }
    
    if (eventData.additionalData?.outgoingPlayerId === eventData.additionalData?.incomingPlayerId) {
      errors.push('Outgoing and incoming player cannot be the same');
    }
    
    if (typeof eventData.timestamp !== 'number' || eventData.timestamp < 0) {
      errors.push('Valid timestamp is required for substitution events');
    }
    
    return errors;
  },
  
  // Validate that a VAR review event has required data
  validateVARReviewEvent: (eventData: any) => {
    const errors: string[] = [];
    
    if (!eventData.additionalData?.reviewType) {
      errors.push('Review type is required for VAR review events');
    }
    
    if (!eventData.additionalData?.decision) {
      errors.push('Decision is required for VAR review events');
    }
    
    if (typeof eventData.timestamp !== 'number' || eventData.timestamp < 0) {
      errors.push('Valid timestamp is required for VAR review events');
    }
    
    return errors;
  },
  
  // Validate that events are in chronological order
  validateEventChronology: (events: any[]) => {
    const errors: string[] = [];
    
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    
    // Check for events that happen after the match ends
    const matchEndEvent = sortedEvents.find(e => e.eventType === 'match_end');
    if (matchEndEvent) {
      const eventsAfterEnd = sortedEvents.filter(e => e.timestamp > matchEndEvent.timestamp);
      if (eventsAfterEnd.length > 0) {
        errors.push(`Found ${eventsAfterEnd.length} events that occur after match end`);
      }
    }
    
    return errors;
  },
  
  // Validate that a player is part of the team for the match
  validatePlayerInTeam: async (matchId: string, teamId: string, playerId: string) => {
    // In a real implementation, you would check the database to verify
    // that the player is part of the team for this specific match
    
    logger.info('Validating player is in team', { matchId, teamId, playerId });
    
    // Check database to verify player is part of the team for this match
    // This would require a database query to check the match lineup or roster
    try {
      // Get match details to verify team participation
      // In a real implementation, you would also check the lineup/roster
      const isPlayerInTeam = true; // Placeholder - would be actual database check
      
      if (!isPlayerInTeam) {
        return [`Player ${playerId} is not part of team ${teamId} for match ${matchId}`];
      }
      
      return [];
    } catch (error: any) {
      logger.error('Player team validation error', error);
      return [`Failed to validate player team membership: ${error.message}`];
    }
  },
  
  // Validate maximum events per time period to prevent spam
  validateEventFrequency: (events: any[], timeWindow: number = 300) => {
    const errors: string[] = [];
    
    // Group events by time window
    const timeWindows: Record<number, number> = {};
    
    events.forEach(event => {
      const windowKey = Math.floor(event.timestamp / timeWindow);
      timeWindows[windowKey] = (timeWindows[windowKey] || 0) + 1;
      
      // If more than 10 events in a 5-minute window, flag as potential spam
      if (timeWindows[windowKey] > 10) {
        errors.push(`Too many events (${timeWindows[windowKey]}) in time window ${windowKey * timeWindow}-${(windowKey + 1) * timeWindow}`);
      }
    });
    
    return errors;
  }
};