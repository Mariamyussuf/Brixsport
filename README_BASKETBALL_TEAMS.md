# Basketball Teams and Players Import Guide

This guide explains how to add your basketball teams and players to the Brixsport database using the provided script.

## Prerequisites

1. Node.js installed on your system
2. Access to the Supabase project credentials
3. Your basketball teams data (names, logos, etc.)
4. Your basketball players data (names, jersey numbers, positions, etc.)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the project root with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

## How to Use the Script

1. **Update Team Data**
   Edit the `basketballTeams` array in `add_basketball_teams.js` with your actual team information:
   - Team names
   - Logo URLs (must be publicly accessible)
   - Stadium information
   - Location details

2. **Update Player Data**
   Edit the `basketballPlayers` object in `add_basketball_teams.js` with your actual player information:
   - Player names
   - Jersey numbers
   - Positions
   - Birth dates
   - Nationalities
   - Physical attributes

3. **Run the Script**
   ```bash
   node add_basketball_teams.js
   ```

## Data Structure

### Teams
Each team should have the following information:
- `name`: Full team name
- `short_name`: Abbreviated team name (3-4 characters)
- `logo_url`: Public URL to the team logo
- `founded_year`: Year the team was established
- `stadium`: Home stadium name
- `city`: City where the team is based
- `country`: Country where the team is based
- `website`: Official team website
- `colors`: Primary and secondary team colors in hex format

### Players
Each player should have the following information:
- `first_name`: Player's first name
- `last_name`: Player's last name
- `jersey_number`: Player's jersey number (1-99)
- `position`: Player's position (Guard, Forward, Center)
- `date_of_birth`: Player's birth date (YYYY-MM-DD)
- `nationality`: Player's nationality (ISO country code)
- `height_cm`: Player's height in centimeters
- `weight_kg`: Player's weight in kilograms
- `status`: Player's status (active, injured, suspended, retired)

## Verification

After running the script, you can verify the data was added correctly by:

1. Checking the Supabase dashboard
2. Using the API endpoints:
   - `GET /api/v1/teams` - List all teams
   - `GET /api/v1/teams/{teamId}/players` - List players for a specific team

## Troubleshooting

- If you get authentication errors, verify your Supabase credentials
- If teams already exist, the script will skip them
- If players already exist, the script will skip them
- Check the console output for any error messages

## Customization

You can modify the script to:
- Add additional player statistics
- Include social media links
- Add team coaches
- Include team roster photos