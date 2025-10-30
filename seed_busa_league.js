/**
 * Script to seed BUSA LEAGUE COMPETITION for both football and basketball
 * 
 * This script creates a new competition in the database for the BUSA LEAGUE COMPETITION
 * with both football and basketball categories in a league phase format.
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');

// Configuration - Replace with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your_service_key';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get current season information
async function getCurrentSeason() {
  try {
    // First, try to get the current season
    const { data: seasons, error: seasonError } = await supabase
      .from('Season')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (seasonError) {
      console.error('Error fetching current season:', seasonError);
      return null;
    }

    // If there's an active season, return it
    if (seasons && seasons.length > 0) {
      return seasons[0];
    }

    // If no active season, create a new one for the current year
    const currentYear = new Date().getFullYear();
    const { data: newSeason, error: createError } = await supabase
      .from('Season')
      .insert({
        name: `BUSA League ${currentYear}`,
        year: currentYear,
        start_date: `${currentYear}-09-01`,
        end_date: `${currentYear + 1}-06-30`,
        description: 'BUSA League Season',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating new season:', createError);
      return null;
    }

    return newSeason;
  } catch (error) {
    console.error('Error in getCurrentSeason:', error);
    return null;
  }
}

// Create BUSA LEAGUE COMPETITION for football
async function createFootballCompetition(seasonId) {
  try {
    const { data: competition, error } = await supabase
      .from('Competition')
      .insert({
        season_id: seasonId,
        name: 'BUSA LEAGUE COMPETITION',
        type: 'league',
        format: 'league_phase',
        status: 'upcoming',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        description: 'BUSA League Competition - Football Division'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating football competition:', error);
      return null;
    }

    console.log('Successfully created football competition:', competition.name);
    return competition;
  } catch (error) {
    console.error('Error in createFootballCompetition:', error);
    return null;
  }
}

// Create BUSA LEAGUE COMPETITION for basketball
async function createBasketballCompetition(seasonId) {
  try {
    const { data: competition, error } = await supabase
      .from('Competition')
      .insert({
        season_id: seasonId,
        name: 'BUSA LEAGUE COMPETITION',
        type: 'league',
        format: 'league_phase',
        status: 'upcoming',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        description: 'BUSA League Competition - Basketball Division'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating basketball competition:', error);
      return null;
    }

    console.log('Successfully created basketball competition:', competition.name);
    return competition;
  } catch (error) {
    console.error('Error in createBasketballCompetition:', error);
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

    return teams || [];
  } catch (error) {
    console.error('Error in getBasketballTeams:', error);
    return [];
  }
}

// Create matches for basketball teams in a round-robin format
async function createBasketballMatches(competitionId, teams) {
  try {
    console.log(`Creating matches for ${teams.length} basketball teams...`);
    
    const matches = [];
    
    // Create round-robin matches where each team plays every other team
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const homeTeam = teams[i];
        const awayTeam = teams[j];
        
        // Create a match record
        const match = {
          competition_id: competitionId,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          scheduled_at: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within 30 days
          venue: homeTeam.stadium || 'Bells University Sports Complex',
          status: 'scheduled'
        };
        
        matches.push(match);
      }
    }
    
    // Insert all matches
    if (matches.length > 0) {
      const { data: insertedMatches, error } = await supabase
        .from('Match')
        .insert(matches)
        .select();
      
      if (error) {
        console.error('Error creating basketball matches:', error);
        return [];
      }
      
      console.log(`Successfully created ${insertedMatches.length} basketball matches`);
      return insertedMatches;
    }
    
    return [];
  } catch (error) {
    console.error('Error in createBasketballMatches:', error);
    return [];
  }
}

// Main function to seed the competitions
async function main() {
  try {
    console.log('Starting BUSA LEAGUE COMPETITION seeding...');
    
    // Get or create current season
    const season = await getCurrentSeason();
    if (!season) {
      console.error('Failed to get or create season');
      return;
    }
    
    console.log('Using season:', season.name);
    
    // Create football competition
    const footballCompetition = await createFootballCompetition(season.id);
    if (!footballCompetition) {
      console.error('Failed to create football competition');
    }
    
    // Create basketball competition
    const basketballCompetition = await createBasketballCompetition(season.id);
    if (!basketballCompetition) {
      console.error('Failed to create basketball competition');
    }
    
    // If basketball competition was created, create matches for basketball teams
    if (basketballCompetition) {
      console.log('Creating basketball matches...');
      const basketballTeams = await getBasketballTeams();
      
      if (basketballTeams.length > 0) {
        await createBasketballMatches(basketballCompetition.id, basketballTeams);
      } else {
        console.log('No basketball teams found to create matches');
      }
    }
    
    console.log('BUSA LEAGUE COMPETITION seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding process:', error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, getCurrentSeason, createFootballCompetition, createBasketballCompetition, getBasketballTeams, createBasketballMatches };