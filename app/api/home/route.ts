import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// Helper function to convert database Match to API Match
const convertMatchToAPIMatch = (match: any) => {
  return {
    id: match.id,
    competition_id: match.competition_id,
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    match_date: match.match_date,
    venue: match.venue,
    status: match.status,
    home_score: match.home_score || 0,
    away_score: match.away_score || 0,
    current_minute: match.current_minute || 0,
    period: match.period,
    created_at: match.created_at,
    home_team_name: match.home_team_name || `Home Team ${match.home_team_id}`,
    home_team_logo: match.home_team_logo || '',
    away_team_name: match.away_team_name || `Away Team ${match.away_team_id}`,
    away_team_logo: match.away_team_logo || '',
    competition_name: match.competition_name || 'Competition'
  };
};

// GET /api/home - Get home screen data with live and upcoming matches
export async function GET(request: NextRequest) {
  console.log('Home API route called');
  
  try {
    // Get the authenticated user (optional for public access)
    const session = await getAuth(request);
    console.log('Authentication session:', session ? 'Authenticated' : 'Not authenticated');
    
    // Ensure dbService is initialized
    if (!dbService) {
      console.error('Database service not initialized');
      throw new Error('Database service not initialized');
    }
    
    console.log('Fetching data from database service');
    
    // Fetch public data that's available to all users
    let liveFootball = [];
    let liveBasketball = [];
    let liveTrack = [];
    let featuredContent = {};
    
    try {
      console.log('Fetching live matches');
      const allLiveMatches = await Promise.race([
        dbService.getLiveMatches(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        )
      ]);
      console.log('All live matches fetched:', allLiveMatches.length);
      
      liveFootball = allLiveMatches.filter(match => match.sport === 'football');
      liveBasketball = allLiveMatches.filter(match => match.sport === 'basketball');
      liveTrack = allLiveMatches.filter(match => match.sport === 'track');
      
      console.log('Live matches by sport - Football:', liveFootball.length, 'Basketball:', liveBasketball.length, 'Track:', liveTrack.length);
      
      featuredContent = await Promise.race([
        dbService.getFeaturedContent(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        )
      ]);
      console.log('Featured content fetched');
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Use fallback data if database fails
      liveFootball = [];
      liveBasketball = [];
      liveTrack = [];
      featuredContent = {
        title: "Welcome to BrixSports",
        description: "Real-time sports analytics and tracking",
        image: ""
      };
    }
    
    console.log('Processing data for response');
    
    // For unauthenticated users, provide generic data
    if (!session) {
      console.log('Processing data for unauthenticated user');
      const homeData = {
        liveFootball: liveFootball.map(convertMatchToAPIMatch),
        upcomingFootball: [], // Public users see limited upcoming matches
        liveBasketball: liveBasketball.map(convertMatchToAPIMatch),
        trackEvents: liveTrack.map(match => ({
          id: match.id,
          competition_id: match.competition_id || 0,
          event_name: `Track Event ${match.id}`,
          event_type: 'Race',
          gender: 'Men',
          scheduled_time: match.match_date,
          status: match.status
        })),
        featuredContent,
        userStats: {
          favoriteTeams: 0,
          followedCompetitions: 0,
          upcomingMatches: 0
        }
      };

      console.log('Sending response for unauthenticated user');
      return NextResponse.json({
        success: true,
        data: homeData
      });
    }

    // For authenticated users, provide personalized data
    console.log('Processing data for authenticated user');
    let upcomingMatches = [];
    let userStats = {
      favoriteTeams: 0,
      followedCompetitions: 0,
      upcomingMatches: 0
    };
    
    try {
      console.log('Fetching upcoming matches and user stats');
      const results = await Promise.race([
        Promise.all([
          dbService.getUpcomingMatches(session.user.id),
          dbService.getUserStats(session.user.id)
        ]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        )
      ]);
      [upcomingMatches, userStats] = results;
      console.log('Upcoming matches and user stats fetched');
    } catch (dbError) {
      console.error('Database error for authenticated user:', dbError);
      // Continue with empty data if database fails
    }

    const homeData = {
      liveFootball: liveFootball.map(convertMatchToAPIMatch),
      upcomingFootball: upcomingMatches.map(convertMatchToAPIMatch),
      liveBasketball: liveBasketball.map(convertMatchToAPIMatch),
      trackEvents: liveTrack.map(match => ({
        id: match.id,
        competition_id: match.competition_id || 0,
        event_name: `Track Event ${match.id}`,
        event_type: 'Race',
        gender: 'Men',
        scheduled_time: match.match_date,
        status: match.status
      })),
      featuredContent,
      userStats
    };

    // Ensure all arrays default to empty arrays if missing
    const response = {
      success: true,
      data: {
        liveFootball: Array.isArray(homeData.liveFootball) ? homeData.liveFootball : [],
        upcomingFootball: Array.isArray(homeData.upcomingFootball) ? homeData.upcomingFootball : [],
        liveBasketball: Array.isArray(homeData.liveBasketball) ? homeData.liveBasketball : [],
        trackEvents: Array.isArray(homeData.trackEvents) ? homeData.trackEvents : [],
        featuredContent: homeData.featuredContent || {},
        userStats: homeData.userStats || {}
      }
    };
    
    console.log('Sending response for authenticated user');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch home data:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch home data'
      },
      { status: 500 }
    );
  }
}