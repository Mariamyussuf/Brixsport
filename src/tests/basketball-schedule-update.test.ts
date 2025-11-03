import { validateMatchUpdate, validateRoundUpdate } from '../../validate_schedule_updates';

describe('Basketball Schedule Update Validation', () => {
  describe('validateMatchUpdate', () => {
    it('should validate correct match update data', () => {
      const update = {
        date: '2025-11-15',
        time: '18:30',
        venue: 'New Sports Complex',
        status: 'scheduled'
      };
      
      const result = validateMatchUpdate(update);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date format', () => {
      const update = {
        date: '2025/11/15', // Invalid format
        time: '18:30',
        venue: 'New Sports Complex',
        status: 'scheduled'
      };
      
      const result = validateMatchUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format. Expected YYYY-MM-DD');
    });

    it('should reject invalid time format', () => {
      const update = {
        date: '2025-11-15',
        time: '25:00', // Invalid time
        venue: 'New Sports Complex',
        status: 'scheduled'
      };
      
      const result = validateMatchUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid time format. Expected HH:MM');
    });

    it('should reject invalid venue', () => {
      const update = {
        date: '2025-11-15',
        time: '18:30',
        venue: '', // Empty venue
        status: 'scheduled'
      };
      
      const result = validateMatchUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid venue. Must be a non-empty string with max 100 characters');
    });

    it('should reject invalid status', () => {
      const update = {
        date: '2025-11-15',
        time: '18:30',
        venue: 'New Sports Complex',
        status: 'postponed' // Invalid status
      };
      
      const result = validateMatchUpdate(update);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status. Must be one of: scheduled, live, completed, cancelled');
    });
  });

  describe('validateRoundUpdate', () => {
    it('should validate correct round update data', () => {
      const roundUpdate = {
        roundId: 'round-1',
        date: '2025-11-15',
        matches: [
          {
            id: 'match-1',
            date: '2025-11-15',
            time: '18:30',
            venue: 'New Sports Complex',
            status: 'scheduled'
          }
        ]
      };
      
      const result = validateRoundUpdate(roundUpdate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject round update without roundId', () => {
      const roundUpdate = {
        date: '2025-11-15',
        matches: []
      };
      
      const result = validateRoundUpdate(roundUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Round ID is required');
    });

    it('should validate match updates within round', () => {
      const roundUpdate = {
        roundId: 'round-1',
        date: '2025-11-15',
        matches: [
          {
            id: 'match-1',
            date: '2025/11/15', // Invalid date
            time: '18:30',
            venue: 'New Sports Complex',
            status: 'scheduled'
          }
        ]
      };
      
      const result = validateRoundUpdate(roundUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Match match-1: Invalid date format. Expected YYYY-MM-DD');
    });
  });
});