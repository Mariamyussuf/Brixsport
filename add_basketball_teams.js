/**
 * Script to add basketball teams and players to the Brixsport database
 * 
 * This script demonstrates how to add basketball teams and players using the existing API structure.
 * You'll need to replace the sample data with your actual team and player information.
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');

// Configuration - Replace with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your_service_key';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample basketball teams data - Replace with your actual data
const basketballTeams = [
  {
    name: 'TITANS',
    short_name: 'TIT',
    logo_url: '/src/assets/titans.jpg',
    founded_year: 2010,
    stadium: 'Bells University Arena',
    city: 'Bells University of Technology',
    country: 'Nigeria',
    website: 'https://titans.example.com',
    colors: { primary: '#000000', secondary: '#FFD700' }
  },
  {
    name: 'STORM',
    short_name: 'STM',
    logo_url: '/src/assets/the storm.jpg',
    founded_year: 2012,
    stadium: 'Bells University Stadium',
    city: 'Bells University of Technology',
    country: 'Nigeria',
    website: 'https://storm.example.com',
    colors: { primary: '#0000FF', secondary: '#FFFFFF' }
  },
  {
    name: 'VIKINGS',
    short_name: 'VKG',
    logo_url: '/src/assets/vikings.jpg',
    founded_year: 2015,
    stadium: 'Bells University Hall',
    city: 'Bells University of Technology',
    country: 'Nigeria',
    website: 'https://vikings.example.com',
    colors: { primary: '#8B0000', secondary: '#FFD700' }
  },
  {
    name: 'Rim Reapers',
    short_name: 'RIM',
    logo_url: '/src/assets/rim reapears.jpg',
    founded_year: 2018,
    stadium: 'Bells University Court',
    city: 'Bells University of Technology',
    country: 'Nigeria',
    website: 'https://rimreapers.example.com',
    colors: { primary: '#228B22', secondary: '#FFFFFF' }
  },
  {
    name: 'Siberia',
    short_name: 'SIB',
    logo_url: '',
    founded_year: 2016,
    stadium: 'Bells University Gym',
    city: 'Bells University of Technology',
    country: 'Nigeria',
    colors: { primary: '#808080', secondary: '#FFFFFF' }
  },
  {
    name: 'TBK',
    short_name: 'TBK',
    logo_url: '',
    founded_year: 2019,
    stadium: 'Bells University Field',
    city: 'Bells University of Technology',
    country: 'Nigeria',
    colors: { primary: '#000000', secondary: '#FF0000' }
  }
];

const basketballPlayers = {
  'TITANS': [
    {
      first_name: 'Ebube',
      last_name: 'Small Forward',
      jersey_number: 0,
      position: 'Small Forward',
      date_of_birth: '1995-01-15',
      nationality: 'Nigeria',
      height_cm: 200,
      weight_kg: 95,
      status: 'active'
    },
    {
      first_name: 'Agana',
      last_name: '',
      jersey_number: 2,
      position: 'Point Guard',
      date_of_birth: '1996-02-20',
      nationality: 'Nigeria',
      height_cm: 185,
      weight_kg: 78,
      status: 'active'
    },
    {
      first_name: 'Demola',
      last_name: '',
      jersey_number: 20,
      position: 'Shooting Guard',
      date_of_birth: '1994-03-10',
      nationality: 'Nigeria',
      height_cm: 193,
      weight_kg: 88,
      status: 'active'
    },
    {
      first_name: 'Alakpa',
      last_name: '',
      jersey_number: 22,
      position: 'Power Forward',
      date_of_birth: '1993-04-25',
      nationality: 'Nigeria',
      height_cm: 205,
      weight_kg: 102,
      status: 'active'
    },
    {
      first_name: 'Adeyemo',
      last_name: '',
      jersey_number: 5,
      position: 'Point Guard',
      date_of_birth: '1997-05-12',
      nationality: 'Nigeria',
      height_cm: 183,
      weight_kg: 75,
      status: 'active'
    },
    {
      first_name: 'Korede',
      last_name: '',
      jersey_number: 3,
      position: 'Shooting Guard',
      date_of_birth: '1995-06-30',
      nationality: 'Nigeria',
      height_cm: 190,
      weight_kg: 82,
      status: 'active'
    },
    {
      first_name: 'Miracle',
      last_name: '',
      jersey_number: 23,
      position: 'Shooting Guard',
      date_of_birth: '1996-07-18',
      nationality: 'Nigeria',
      height_cm: 192,
      weight_kg: 85,
      status: 'active'
    },
    {
      first_name: 'Donald',
      last_name: '',
      jersey_number: 9,
      position: 'Point Guard',
      date_of_birth: '1994-08-22',
      nationality: 'Nigeria',
      height_cm: 186,
      weight_kg: 79,
      status: 'active'
    },
    {
      first_name: 'Ebuka',
      last_name: '',
      jersey_number: 30,
      position: 'Shooting Guard',
      date_of_birth: '1997-09-05',
      nationality: 'Nigeria',
      height_cm: 194,
      weight_kg: 87,
      status: 'active'
    },
    {
      first_name: 'Fatiu',
      last_name: '',
      jersey_number: 12,
      position: 'Center',
      date_of_birth: '1992-10-14',
      nationality: 'Nigeria',
      height_cm: 210,
      weight_kg: 110,
      status: 'active'
    }
  ],
  'STORM': [
    {
      first_name: 'Ola',
      last_name: '',
      jersey_number: 12,
      position: 'Center',
      date_of_birth: '1995-02-10',
      nationality: 'Nigeria',
      height_cm: 210,
      weight_kg: 110,
      status: 'active'
    },
    {
      first_name: 'Erin',
      last_name: '',
      jersey_number: 26,
      position: 'Guard',
      date_of_birth: '1996-03-15',
      nationality: 'Nigeria',
      height_cm: 185,
      weight_kg: 78,
      status: 'active'
    },
    {
      first_name: 'Jordan',
      last_name: '',
      jersey_number: 23,
      position: 'Forward',
      date_of_birth: '1994-04-20',
      nationality: 'Nigeria',
      height_cm: 203,
      weight_kg: 98,
      status: 'active'
    },
    {
      first_name: 'Emeke',
      last_name: '',
      jersey_number: 10,
      position: 'Guard',
      date_of_birth: '1997-05-25',
      nationality: 'Nigeria',
      height_cm: 190,
      weight_kg: 82,
      status: 'active'
    },
    {
      first_name: 'Campbell',
      last_name: '',
      jersey_number: 2,
      position: 'Forward',
      date_of_birth: '1993-06-30',
      nationality: 'Nigeria',
      height_cm: 205,
      weight_kg: 102,
      status: 'active'
    },
    {
      first_name: 'Pwajok',
      last_name: 'Jnr',
      jersey_number: 67,
      position: 'Guard',
      date_of_birth: '1996-07-05',
      nationality: 'Nigeria',
      height_cm: 188,
      weight_kg: 80,
      status: 'active'
    },
    {
      first_name: 'Ike',
      last_name: '',
      jersey_number: 77,
      position: 'Forward',
      date_of_birth: '1995-08-10',
      nationality: 'Nigeria',
      height_cm: 206,
      weight_kg: 105,
      status: 'active'
    },
    {
      first_name: 'Dinma',
      last_name: '',
      jersey_number: 1,
      position: 'Forward',
      date_of_birth: '1998-09-15',
      nationality: 'Nigeria',
      height_cm: 204,
      weight_kg: 100,
      status: 'active'
    },
    {
      first_name: 'Ralph',
      last_name: 'Kumzhi',
      jersey_number: 0,
      position: 'Guard',
      date_of_birth: '1994-10-20',
      nationality: 'Nigeria',
      height_cm: 183,
      weight_kg: 75,
      status: 'active'
    },
    {
      first_name: 'Daverex',
      last_name: '',
      jersey_number: 35,
      position: 'Guard',
      date_of_birth: '1997-11-25',
      nationality: 'Nigeria',
      height_cm: 192,
      weight_kg: 85,
      status: 'active'
    }
  ],
  'VIKINGS': [
    {
      first_name: 'Ojay',
      last_name: '',
      jersey_number: 0,
      position: 'Guard',
      date_of_birth: '1996-01-05',
      nationality: 'Nigeria',
      height_cm: 185,
      weight_kg: 78,
      status: 'active'
    },
    {
      first_name: 'Jehu',
      last_name: '',
      jersey_number: 13,
      position: 'Guard',
      date_of_birth: '1995-02-15',
      nationality: 'Nigeria',
      height_cm: 188,
      weight_kg: 80,
      status: 'active'
    },
    {
      first_name: 'Zubby',
      last_name: '',
      jersey_number: 12,
      position: 'Forward',
      date_of_birth: '1994-03-20',
      nationality: 'Nigeria',
      height_cm: 203,
      weight_kg: 98,
      status: 'active'
    },
    {
      first_name: 'Kamkid',
      last_name: '',
      jersey_number: 10,
      position: 'Guard',
      date_of_birth: '1997-04-25',
      nationality: 'Nigeria',
      height_cm: 190,
      weight_kg: 82,
      status: 'active'
    },
    {
      first_name: 'Plutobabyy',
      last_name: '',
      jersey_number: 5,
      position: 'Guard',
      date_of_birth: '1996-05-30',
      nationality: 'Nigeria',
      height_cm: 187,
      weight_kg: 79,
      status: 'active'
    },
    {
      first_name: 'Wilton',
      last_name: '',
      jersey_number: 16,
      position: 'Forward',
      date_of_birth: '1993-06-10',
      nationality: 'Nigeria',
      height_cm: 205,
      weight_kg: 102,
      status: 'active'
    },
    {
      first_name: 'Lumi',
      last_name: '',
      jersey_number: 17,
      position: 'Center',
      date_of_birth: '1995-07-15',
      nationality: 'Nigeria',
      height_cm: 210,
      weight_kg: 110,
      status: 'active'
    },
    {
      first_name: 'Sarah',
      last_name: '',
      jersey_number: 3,
      position: 'Forward',
      date_of_birth: '1998-08-20',
      nationality: 'Nigeria',
      height_cm: 204,
      weight_kg: 100,
      status: 'active'
    },
    {
      first_name: 'David',
      last_name: '',
      jersey_number: 1,
      position: 'Guard',
      date_of_birth: '1994-09-25',
      nationality: 'Nigeria',
      height_cm: 183,
      weight_kg: 75,
      status: 'active'
    },
    {
      first_name: 'Oginni',
      last_name: '',
      jersey_number: 11,
      position: 'Forward',
      date_of_birth: '1996-10-30',
      nationality: 'Nigeria',
      height_cm: 206,
      weight_kg: 105,
      status: 'active'
    },
    {
      first_name: 'Obinna',
      last_name: '',
      jersey_number: 23,
      position: 'Forward',
      date_of_birth: '1997-11-15',
      nationality: 'Nigeria',
      height_cm: 207,
      weight_kg: 106,
      status: 'active'
    }
  ],
  'Rim Reapers': [
    {
      first_name: 'Light',
      last_name: '',
      jersey_number: 3,
      position: 'Center',
      date_of_birth: '1995-03-10',
      nationality: 'Nigeria',
      height_cm: 210,
      weight_kg: 110,
      status: 'active'
    },
    {
      first_name: 'Mazi',
      last_name: '',
      jersey_number: 1,
      position: 'Point Guard',
      date_of_birth: '1996-04-15',
      nationality: 'Nigeria',
      height_cm: 185,
      weight_kg: 78,
      status: 'active'
    },
    {
      first_name: 'Leo',
      last_name: '',
      jersey_number: 7,
      position: 'Power Forward',
      date_of_birth: '1994-05-20',
      nationality: 'Nigeria',
      height_cm: 205,
      weight_kg: 102,
      status: 'active'
    },
    {
      first_name: 'Mofe',
      last_name: '',
      jersey_number: 6,
      position: 'Point Guard',
      date_of_birth: '1997-06-25',
      nationality: 'Nigeria',
      height_cm: 183,
      weight_kg: 75,
      status: 'active'
    },
    {
      first_name: 'Becky',
      last_name: '',
      jersey_number: 24,
      position: 'Shooting Guard',
      date_of_birth: '1995-07-30',
      nationality: 'Nigeria',
      height_cm: 190,
      weight_kg: 82,
      status: 'active'
    },
    {
      first_name: 'Abdulrahman',
      last_name: '',
      jersey_number: 0,
      position: 'Power Forward',
      date_of_birth: '1993-08-10',
      nationality: 'Nigeria',
      height_cm: 206,
      weight_kg: 105,
      status: 'active'
    },
    {
      first_name: 'Nathaniel',
      last_name: '',
      jersey_number: 8,
      position: 'Shooting Guard',
      date_of_birth: '1996-09-15',
      nationality: 'Nigeria',
      height_cm: 192,
      weight_kg: 85,
      status: 'active'
    },
    {
      first_name: 'Joseph',
      last_name: '',
      jersey_number: 23,
      position: 'Point Guard',
      date_of_birth: '1994-10-20',
      nationality: 'Nigeria',
      height_cm: 186,
      weight_kg: 79,
      status: 'active'
    },
    {
      first_name: 'Dekunle',
      last_name: '',
      jersey_number: 77,
      position: 'Small Forward',
      date_of_birth: '1995-11-25',
      nationality: 'Nigeria',
      height_cm: 200,
      weight_kg: 95,
      status: 'active'
    },
    {
      first_name: 'Damilade',
      last_name: '',
      jersey_number: 9,
      position: 'Small Forward',
      date_of_birth: '1997-12-30',
      nationality: 'Nigeria',
      height_cm: 198,
      weight_kg: 92,
      status: 'active'
    }
  ],
  'Siberia': [
    // Waiting for player information
  ],
  'TBK': [
    // Waiting for player information
  ]
};

/**
 * Add basketball teams to the database
 */
async function addTeams() {
  console.log('Adding basketball teams...');
  
  const createdTeams = [];
  
  for (const teamData of basketballTeams) {
    try {
      // Check if team already exists
      const { data: existingTeams, error: existingError } = await supabase
        .from('Team')
        .select('id')
        .eq('name', teamData.name)
        .eq('sport', 'BASKETBALL');
      
      if (existingError) {
        console.error(`Error checking existing team ${teamData.name}:`, existingError);
        continue;
      }
      
      if (existingTeams && existingTeams.length > 0) {
        console.log(`Team ${teamData.name} already exists, skipping...`);
        createdTeams.push({ ...teamData, id: existingTeams[0].id });
        continue;
      }
      
      // Add sport field to team data
      const teamWithSport = { ...teamData, sport: 'BASKETBALL' };
      
      // Insert new team
      const { data, error } = await supabase
        .from('Team')
        .insert(teamWithSport)
        .select()
        .single();
      
      if (error) {
        console.error(`Error adding team ${teamData.name}:`, error);
        continue;
      }
      
      console.log(`Successfully added team: ${data.name} (ID: ${data.id})`);
      createdTeams.push(data);
    } catch (error) {
      console.error(`Error processing team ${teamData.name}:`, error);
    }
  }
  
  return createdTeams;
}

/**
 * Add basketball players to the database
 */
async function addPlayers(teams) {
  console.log('Adding basketball players...');
  
  for (const team of teams) {
    const players = basketballPlayers[team.name];
    
    if (!players || players.length === 0) {
      console.log(`No players found for team ${team.name}`);
      continue;
    }
    
    console.log(`Adding players for team: ${team.name}`);
    
    for (const playerData of players) {
      try {
        // Check if player already exists
        const { data: existingPlayers, error: existingError } = await supabase
          .from('Player')
          .select('id')
          .eq('first_name', playerData.first_name)
          .eq('last_name', playerData.last_name)
          .eq('team_id', team.id);
        
        if (existingError) {
          console.error(`Error checking existing player ${playerData.first_name} ${playerData.last_name}:`, existingError);
          continue;
        }
        
        if (existingPlayers && existingPlayers.length > 0) {
          console.log(`Player ${playerData.first_name} ${playerData.last_name} already exists, skipping...`);
          continue;
        }
        
        // Add team_id to player data
        const playerWithTeam = { ...playerData, team_id: team.id };
        
        // Insert new player
        const { data, error } = await supabase
          .from('Player')
          .insert(playerWithTeam)
          .select()
          .single();
        
        if (error) {
          console.error(`Error adding player ${playerData.first_name} ${playerData.last_name}:`, error);
          continue;
        }
        
        console.log(`Successfully added player: ${data.first_name} ${data.last_name} (ID: ${data.id})`);
      } catch (error) {
        console.error(`Error processing player ${playerData.first_name} ${playerData.last_name}:`, error);
      }
    }
  }
}

/**
 * Main function to add teams and players
 */
async function main() {
  try {
    console.log('Starting basketball teams and players import...');
    
    // Add teams
    const teams = await addTeams();
    
    if (teams.length === 0) {
      console.log('No teams were added, exiting...');
      return;
    }
    
    // Add players
    await addPlayers(teams);
    
    console.log('Basketball teams and players import completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = { addTeams, addPlayers, main };