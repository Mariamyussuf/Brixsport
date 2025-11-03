/**
 * Script to validate schedule updates for the basketball league
 * 
 * This script provides functions to validate changes to the basketball schedule
 * including date changes, time changes, venue changes, and cancellations.
 */

// Import required modules
const fs = require('fs').promises;
const path = require('path');

// Load schedule from JSON file
async function loadSchedule() {
  try {
    const filePath = path.join(__dirname, 'basketball_schedule.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading schedule:', error);
    return null;
  }
}

// Validate date format (YYYY-MM-DD)
function validateDateFormat(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate time format (HH:MM)
function validateTimeFormat(timeString) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

// Validate venue string
function validateVenue(venue) {
  return typeof venue === 'string' && venue.length > 0 && venue.length <= 100;
}

// Validate status
function validateStatus(status) {
  const validStatuses = ['scheduled', 'live', 'completed', 'cancelled'];
  return validStatuses.includes(status);
}

// Validate match update
function validateMatchUpdate(update) {
  const errors = [];
  
  if (update.date && !validateDateFormat(update.date)) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  }
  
  if (update.time && !validateTimeFormat(update.time)) {
    errors.push('Invalid time format. Expected HH:MM');
  }
  
  if (update.venue && !validateVenue(update.venue)) {
    errors.push('Invalid venue. Must be a non-empty string with max 100 characters');
  }
  
  if (update.status && !validateStatus(update.status)) {
    errors.push('Invalid status. Must be one of: scheduled, live, completed, cancelled');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate round update
function validateRoundUpdate(roundUpdate) {
  const errors = [];
  
  if (!roundUpdate.roundId) {
    errors.push('Round ID is required');
  }
  
  if (roundUpdate.date && !validateDateFormat(roundUpdate.date)) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  }
  
  if (roundUpdate.matches && Array.isArray(roundUpdate.matches)) {
    for (const match of roundUpdate.matches) {
      const matchValidation = validateMatchUpdate(match);
      if (!matchValidation.isValid) {
        errors.push(...matchValidation.errors.map(err => `Match ${match.id}: ${err}`));
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Example usage
async function example() {
  try {
    // Load the current schedule
    const schedule = await loadSchedule();
    if (!schedule) {
      console.error('Failed to load schedule');
      return;
    }
    
    console.log('Schedule loaded successfully');
    console.log(`League: ${schedule.league}`);
    console.log(`Season: ${schedule.season}`);
    console.log(`Teams: ${schedule.teams.join(', ')}`);
    console.log(`Rounds: ${schedule.rounds.length}`);
    
    // Example validation of a match update
    const matchUpdate = {
      date: '2025-11-15',
      time: '18:30',
      venue: 'New Sports Complex',
      status: 'scheduled'
    };
    
    const validation = validateMatchUpdate(matchUpdate);
    if (validation.isValid) {
      console.log('Match update is valid');
    } else {
      console.log('Match update is invalid:');
      validation.errors.forEach(err => console.log(`- ${err}`));
    }
    
    // Example validation of an invalid match update
    const invalidMatchUpdate = {
      date: '2025/11/15', // Invalid format
      time: '25:00', // Invalid time
      venue: '', // Empty venue
      status: 'postponed' // Invalid status
    };
    
    const invalidValidation = validateMatchUpdate(invalidMatchUpdate);
    if (invalidValidation.isValid) {
      console.log('Invalid match update was somehow valid (this should not happen)');
    } else {
      console.log('Invalid match update correctly identified as invalid:');
      invalidValidation.errors.forEach(err => console.log(`- ${err}`));
    }
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example if executed directly
if (require.main === module) {
  example();
}

module.exports = {
  validateDateFormat,
  validateTimeFormat,
  validateVenue,
  validateStatus,
  validateMatchUpdate,
  validateRoundUpdate
};