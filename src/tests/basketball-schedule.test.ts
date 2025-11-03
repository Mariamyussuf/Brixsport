import { describe, it, expect } from '@jest/globals';

describe('Basketball Schedule API', () => {
  it('should have the required schedule data structure', () => {
    // Import the schedule data
    const schedule = require('../../basketball_schedule.json');
    
    // Check that the schedule has the required properties
    expect(schedule).toHaveProperty('league');
    expect(schedule).toHaveProperty('season');
    expect(schedule).toHaveProperty('teams');
    expect(schedule).toHaveProperty('rounds');
    expect(schedule).toHaveProperty('events');
    
    // Check that teams array is not empty
    expect(schedule.teams).toBeInstanceOf(Array);
    expect(schedule.teams.length).toBeGreaterThan(0);
    
    // Check that rounds array is not empty
    expect(schedule.rounds).toBeInstanceOf(Array);
    expect(schedule.rounds.length).toBeGreaterThan(0);
    
    // Check the structure of the first round
    const firstRound = schedule.rounds[0];
    expect(firstRound).toHaveProperty('round');
    expect(firstRound).toHaveProperty('date');
    expect(firstRound).toHaveProperty('matches');
    
    // Check that matches array is not empty in the first round
    expect(firstRound.matches).toBeInstanceOf(Array);
    expect(firstRound.matches.length).toBeGreaterThan(0);
    
    // Check the structure of the first match
    const firstMatch = firstRound.matches[0];
    expect(firstMatch).toHaveProperty('home_team');
    expect(firstMatch).toHaveProperty('away_team');
    expect(firstMatch).toHaveProperty('time');
    expect(firstMatch).toHaveProperty('venue');
  });
  
  it('should have the correct number of teams', () => {
    const schedule = require('../../basketball_schedule.json');
    expect(schedule.teams).toHaveLength(6);
  });
  
  it('should have all required teams', () => {
    const schedule = require('../../basketball_schedule.json');
    const requiredTeams = ['TBK', 'Titans', 'Storm', 'Vikings', 'Rim Reapers', 'Siberia'];
    
    requiredTeams.forEach(team => {
      expect(schedule.teams).toContain(team);
    });
  });
});