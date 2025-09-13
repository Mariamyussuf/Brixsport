import { CampusEventType, SportType, Team, Player } from '@/types/campus';
import { MatchEvent, EventType } from '@/types/matchEvents';

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Enhanced event validation
export function validateEvent(
  eventType: CampusEventType | EventType,
  selectedTeam: Team | null,
  selectedPlayerId: string | null,
  eventValue: string | number | undefined,
  sportType: SportType,
  existingEvents: any[] = []
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!selectedTeam) {
    errors.push({
      field: 'team',
      message: 'Please select a team',
      code: 'MISSING_TEAM'
    });
  }

  if (!eventType) {
    errors.push({
      field: 'eventType',
      message: 'Please select an event type',
      code: 'MISSING_EVENT_TYPE'
    });
  }

  // Player selection validation (required for most team sports)
  const teamSports = ['football', 'basketball', 'volleyball', 'table_tennis', 'badminton'];
  if (teamSports.includes(sportType) && !selectedPlayerId) {
    errors.push({
      field: 'player',
      message: 'Please select a player',
      code: 'MISSING_PLAYER'
    });
  }

  // Value validation for track events
  if (sportType === 'track_events' && !eventValue) {
    const requiresValue = ['measurement', 'jump_attempt', 'throw_attempt', 'lap_time'].includes(eventType);
    if (requiresValue) {
      errors.push({
        field: 'value',
        message: 'Please enter a value (e.g., time, measurement)',
        code: 'MISSING_VALUE'
      });
    }
  }

  // Value format validation
  if (eventValue && sportType === 'track_events') {
    // Validate time format (e.g., 12.34, 1:23.45)
    if (['lap_time', 'race_finish'].includes(eventType)) {
      const timeRegex = /^(\d+:)?\d{1,2}\.\d{2}$/;
      if (typeof eventValue === 'string' && !timeRegex.test(eventValue)) {
        errors.push({
          field: 'value',
          message: 'Invalid time format. Use format like 12.34 or 1:23.45',
          code: 'INVALID_TIME_FORMAT'
        });
      }
    }
    
    // Validate measurement format (e.g., 5.25m, 12.34s)
    if (['measurement', 'jump_attempt', 'throw_attempt'].includes(eventType)) {
      const measurementRegex = /^\d+(\.\d+)?\s*[a-zA-Z]*$/;
      if (typeof eventValue === 'string' && !measurementRegex.test(eventValue)) {
        errors.push({
          field: 'value',
          message: 'Invalid measurement format. Use format like 5.25m or 12.34s',
          code: 'INVALID_MEASUREMENT_FORMAT'
        });
      }
    }
  }

  // Player number validation
  if (selectedPlayerId && selectedTeam) {
    const player = selectedTeam.players.find(p => p.id === selectedPlayerId);
    if (player && player.number) {
      // Check if player number is numeric
      if (isNaN(Number(player.number))) {
        errors.push({
          field: 'playerNumber',
          message: 'Player number must be numeric',
          code: 'INVALID_PLAYER_NUMBER'
        });
      }
      
      // Check for duplicate player numbers in the same team
      const duplicateNumbers = selectedTeam.players.filter(p => 
        p.id !== player.id && p.number === player.number
      );
      
      if (duplicateNumbers.length > 0) {
        errors.push({
          field: 'playerNumber',
          message: 'Duplicate player number in the same team',
          code: 'DUPLICATE_PLAYER_NUMBER'
        });
      }
    }
  }

  // Football specific validations
  if (sportType === 'football') {
    // Check team size (max 11 players on field)
    if (selectedTeam && selectedTeam.players.length > 11) {
      errors.push({
        field: 'teamSize',
        message: 'Cannot have more than 11 players on the field for football',
        code: 'EXCEEDS_FOOTBALL_TEAM_SIZE'
      });
    }
    
    // Validate substitution event
    if (eventType === 'substitution') {
      // Check if both players are selected for substitution
      // This would require additional form fields in the UI
    }
  }

  // Prevent duplicate events in the same second
  if (existingEvents.length > 0) {
    const nowSec = Math.floor(Date.now() / 1000);
    const duplicateEvent = existingEvents.find(ev => 
      ev.eventType === eventType && 
      Math.floor(new Date(ev.timestamp).getTime() / 1000) === nowSec
    );
    
    if (duplicateEvent) {
      errors.push({
        field: 'duplicate',
        message: 'Duplicate event detected in the same second',
        code: 'DUPLICATE_EVENT'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Match validation
export function validateMatch(
  matchData: {
    name: string;
    homeTeamId: string;
    awayTeamId: string;
    date: string;
    location: string;
  }
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!matchData.name || matchData.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Match name is required',
      code: 'MISSING_MATCH_NAME'
    });
  }

  if (!matchData.homeTeamId) {
    errors.push({
      field: 'homeTeam',
      message: 'Home team is required',
      code: 'MISSING_HOME_TEAM'
    });
  }

  if (!matchData.awayTeamId) {
    errors.push({
      field: 'awayTeam',
      message: 'Away team is required',
      code: 'MISSING_AWAY_TEAM'
    });
  }

  if (matchData.homeTeamId === matchData.awayTeamId) {
    errors.push({
      field: 'teams',
      message: 'Home and away teams must be different',
      code: 'SAME_TEAMS'
    });
  }

  if (!matchData.date) {
    errors.push({
      field: 'date',
      message: 'Match date is required',
      code: 'MISSING_DATE'
    });
  }

  if (!matchData.location || matchData.location.trim().length === 0) {
    errors.push({
      field: 'location',
      message: 'Match location is required',
      code: 'MISSING_LOCATION'
    });
  }

  // Date validation
  if (matchData.date) {
    const matchDate = new Date(matchData.date);
    const now = new Date();
    
    // Check if date is in the past
    if (matchDate < now) {
      errors.push({
        field: 'date',
        message: 'Match date cannot be in the past',
        code: 'PAST_DATE'
      });
    }
    
    // Check if date is too far in the future (e.g., more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (matchDate > oneYearFromNow) {
      errors.push({
        field: 'date',
        message: 'Match date cannot be more than 1 year in the future',
        code: 'FUTURE_DATE'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Player validation
export function validatePlayer(playerData: Partial<Player>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!playerData.name || playerData.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Player name is required',
      code: 'MISSING_PLAYER_NAME'
    });
  }

  // Number validation
  if (playerData.number) {
    // Check if number is numeric
    if (isNaN(Number(playerData.number))) {
      errors.push({
        field: 'number',
        message: 'Player number must be numeric',
        code: 'INVALID_PLAYER_NUMBER'
      });
    }
    
    // Check number range (1-99)
    const num = Number(playerData.number);
    if (num < 1 || num > 99) {
      errors.push({
        field: 'number',
        message: 'Player number must be between 1 and 99',
        code: 'INVALID_PLAYER_NUMBER_RANGE'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => error.message).join(', ');
}

// Create standardized API error
export function createApiError(
  message: string,
  code: string = 'VALIDATION_ERROR',
  status: number = 400,
  errors: ValidationError[] = []
): any {
  return {
    success: false,
    message,
    code,
    status,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString()
  };
}