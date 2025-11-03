/**
 * Script to import the basketball league schedule into the Brixsport database
 * 
 * This script reads the basketball_schedule.json file and creates matches in the database
 * with the correct dates, times, and venues according to the official schedule.
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration - Use credentials from .env file
require('dotenv').config({ path: './.env' });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_key';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

// Get basketball competition
async function getBasketballCompetition() {
  try {
    const { data: competitions, error } = await supabase
      .from('Competition')
      .select('*')
      .eq('name', 'BUSA LEAGUE COMPETITION')
      .eq('description', 'BUSA League Competition - Basketball Division')
      .limit(1);

    if (error) {
      console.error('Error fetching basketball competition:', error);
      return null;
    }

    if (!competitions || competitions.length === 0) {
      console.error('Basketball competition not found');
      return null;
    }

    return competitions[0];
  } catch (error) {
    console.error('Error in getBasketballCompetition:', error);
    return null;
  }
}

// Get all basketball teams
async function getBasketballTeams() {
  try {
    const { data: teams, error } = await supabase
      .from('Team')
      .select('*')
      .eq('sport', 'BASKETBALL');

    if (error) {
      console.error('Error fetching basketball teams:', error);
      return [];
    }

    // Create a map for easy lookup by team name
    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.name] = team;
    });

    return teamMap;
  } catch (error) {
    console.error('Error in getBasketballTeams:', error);
    return {};
  }
}

// Create matches for a specific round
async function createMatchesForRound(competitionId, roundData, teams) {
  try {
    console.log(`Creating matches for round on ${roundData.date}...`);
    
    const matches = [];
    
    // Parse the date
    const matchDate = new Date(roundData.date);
    
    for (const matchData of roundData.matches) {
      // Validate teams exist
      if (!teams[matchData.home_team] || !teams[matchData.away_team]) {
        console.warn(`Skipping match: Team not found - ${matchData.home_team} vs ${matchData.away_team}`);
        continue;
      }
      
      // Combine date and time
      const [hours, minutes] = matchData.time.split(':').map(Number);
      const scheduledDateTime = new Date(matchDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      // Create a match record
      const match = {
        competition_id: competitionId,
        home_team_id: teams[matchData.home_team].id,
        away_team_id: teams[matchData.away_team].id,
        scheduled_at: scheduledDateTime.toISOString(),
        venue: matchData.venue || teams[matchData.home_team].stadium || 'Bells University Sports Complex',
        status: 'scheduled'
      };
      
      matches.push(match);
    }
    
    // Insert all matches
    if (matches.length > 0) {
      const { data: insertedMatches, error } = await supabase
        .from('Match')
        .insert(matches)
        .select();
      
      if (error) {
        console.error('Error creating matches:', error);
        return [];
      }
      
      console.log(`Successfully created ${insertedMatches.length} matches for ${roundData.date}`);
      return insertedMatches;
    }
    
    return [];
  } catch (error) {
    console.error('Error in createMatchesForRound:', error);
    return [];
  }
}

// Create special events (draft, all-star, etc.)
async function createSpecialEvents(competitionId, events, teams) {
  try {
    console.log('Creating special events...');
    
    const specialMatches = [];
    
    for (const event of events) {
      // For special events, we'll create a match record with a special flag
      // In a real implementation, you might want a separate events table
      const eventDate = new Date(event.date);
      eventDate.setHours(12, 0, 0, 0); // Set to noon if no specific time
      
      const specialMatch = {
        competition_id: competitionId,
        home_team_id: null, // Special event, no specific teams
        away_team_id: null,
        scheduled_at: eventDate.toISOString(),
        venue: event.venue || 'Bells University Sports Complex',
        status: 'scheduled',
        description: event.name
      };
      
      specialMatches.push(specialMatch);
    }
    
    // Insert special events
    if (specialMatches.length > 0) {
      const { data: insertedEvents, error } = await supabase
        .from('Match')
        .insert(specialMatches)
        .select();
      
      if (error) {
        console.error('Error creating special events:', error);
        return [];
      }
      
      console.log(`Successfully created ${insertedEvents.length} special events`);
      return insertedEvents;
    }
    
    return [];
  } catch (error) {
    console.error('Error in createSpecialEvents:', error);
    return [];
  }
}

// Main function to import the schedule
async function main() {
  try {
    console.log('Starting basketball schedule import...');
    
    // Load schedule data
    const schedule = await loadSchedule();
    if (!schedule) {
      console.error('Failed to load schedule');
      return;
    }
    
    // Get basketball competition
    const competition = await getBasketballCompetition();
    if (!competition) {
      console.error('Failed to get basketball competition');
      return;
    }
    
    console.log('Using competition:', competition.name);
    
    // Get all basketball teams
    const teams = await getBasketballTeams();
    if (Object.keys(teams).length === 0) {
      console.error('No basketball teams found');
      return;
    }
    
    console.log(`Found ${Object.keys(teams).length} basketball teams`);
    
    // Create matches for each round
    let totalMatches = 0;
    for (const round of schedule.rounds) {
      const matches = await createMatchesForRound(competition.id, round, teams);
      totalMatches += matches.length;
    }
    
    // Create special events
    if (schedule.events && schedule.events.length > 0) {
      const specialEvents = await createSpecialEvents(competition.id, schedule.events, teams);
      totalMatches += specialEvents.length;
    }
    
    console.log(`Basketball schedule import completed successfully! Created ${totalMatches} matches and events.`);
  } catch (error) {
    console.error('Error during schedule import process:', error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, loadSchedule, getBasketballCompetition, getBasketballTeams, createMatchesForRound, createSpecialEvents };