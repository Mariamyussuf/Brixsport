# BUSA LEAGUE COMPETITION Seeding Guide

This guide explains how to seed the BUSA LEAGUE COMPETITION for both football and basketball using the provided script.

## Prerequisites

1. Node.js installed on your system
2. Access to the Supabase project credentials
3. The basketball teams should already be added to the database

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

1. **Run the Seeding Script**
   ```bash
   node seed_busa_league.js
   ```

## What the Script Does

The script will:

1. Check for an existing active season or create a new one for the current year
2. Create a BUSA LEAGUE COMPETITION entry for football
3. Create a BUSA LEAGUE COMPETITION entry for basketball
4. For the basketball competition, it will:
   - Retrieve all basketball teams from the database
   - Create round-robin matches where each team plays every other team once
   - Schedule matches at random dates within the next 30 days
   - Assign venues based on home teams' stadiums

## Competition Details

- **Name**: BUSA LEAGUE COMPETITION
- **Format**: League phase
- **Sports**: Football and Basketball
- **Structure**: Single group where all teams play each other (round-robin)

## Verification

After running the script, you can verify the data was added correctly by:

1. Checking the Supabase dashboard
2. Using the API endpoints:
   - `GET /api/v1/competitions` - List all competitions
   - `GET /api/v1/competitions/{competitionId}/matches` - List matches for a specific competition

## Troubleshooting

- If you get authentication errors, verify your Supabase credentials
- If no matches are created, ensure basketball teams exist in the database
- Check the console output for any error messages

## Customization

You can modify the script to:
- Change competition dates
- Modify match scheduling logic
- Add additional competition details
- Adjust the round-robin format