import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// Helper function to convert database Match to API Match
const convertMatchToAPIMatch = (match: any) => {
  return {
    id: match.id.toString(),
    competition_id: match.competition_id.toString(),
    home_team_id: match.home_team_id.toString(),
    away_team_id: match.away_team_id.toString(),
    match_date: match.match_date,
    status: match.status,
    home_score: match.home_score,
    away_score: match.away_score,
    sport: match.sport
  };
};

// GET /api/home - Get home screen data with live and upcoming matches
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user (optional for public access)
    const session = await getAuth(request);
    
    // Fetch public data that's available to all users
    const liveFootball = (await dbService.getLiveMatches()).filter(match => match.sport === 'football');
    const liveBasketball = (await dbService.getLiveMatches()).filter(match => match.sport === 'basketball');
    const liveTrack = (await dbService.getLiveMatches()).filter(match => match.sport === 'track');
    const featuredContent = await dbService.getFeaturedContent();
    
    // For unauthenticated users, provide generic data
    if (!session) {
      const homeData = {
        liveFootball: liveFootball.map(convertMatchToAPIMatch),
        liveBasketball: liveBasketball.map(convertMatchToAPIMatch),
        trackEvents: liveTrack.map(match => ({
          id: match.id.toString(),
          name: `Track Event ${match.id}`,
          status: match.status,
          start_time: match.match_date,
          results: []
        })),
        upcomingFootball: [], // Public users see limited upcoming matches
        featuredContent,
        userStats: {
          favoriteTeams: 0,
          followedCompetitions: 0,
          upcomingMatches: 0
        }
      };

      return NextResponse.json({
        success: true,
        data: homeData
      });
    }

    // For authenticated users, provide personalized data
    const [upcomingMatches, userStats] = await Promise.all([
      dbService.getUpcomingMatches(session.user.id),
      dbService.getUserStats(session.user.id)
    ]);

    const homeData = {
      liveFootball: liveFootball.map(convertMatchToAPIMatch),
      liveBasketball: liveBasketball.map(convertMatchToAPIMatch),
      trackEvents: liveTrack.map(match => ({
        id: match.id.toString(),
        name: `Track Event ${match.id}`,
        status: match.status,
        start_time: match.match_date,
        results: []
      })),
      upcomingFootball: upcomingMatches.map(convertMatchToAPIMatch),
      featuredContent,
      userStats
    };

    return NextResponse.json({
      success: true,
      data: homeData
    });
  } catch (error) {
    console.error('Failed to fetch home data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          message: 'Failed to fetch home data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}