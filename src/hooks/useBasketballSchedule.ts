import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface ScheduleMatch {
  id: string;
  home_team_name: string;
  away_team_name: string;
  scheduled_at: string;
  venue: string;
  status: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
}

export interface ScheduleRound {
  round: string | number;
  date: string;
  matches: ScheduleMatch[];
}

export const useBasketballSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the basketball competition
      const { data: competition, error: competitionError } = await supabase
        .from('Competition')
        .select('id')
        .eq('name', 'BUSA LEAGUE COMPETITION')
        .eq('description', 'BUSA League Competition - Basketball Division')
        .single();

      if (competitionError) {
        throw new Error('Failed to fetch basketball competition');
      }

      // Get all matches for this competition
      const { data: matches, error: matchesError } = await supabase
        .from('Match')
        .select(`
          id,
          homeTeamId,
          awayTeamId,
          startTime,
          venue,
          status,
          homeTeam:Team!Match_homeTeamId_fkey(name, logo),
          awayTeam:Team!Match_awayTeamId_fkey(name, logo)
        `)
        .eq('competitionId', competition.id)
        .order('startTime', { ascending: true });

      if (matchesError) {
        throw new Error('Failed to fetch matches');
      }

      // Transform the data into rounds
      const rounds = transformMatchesToRounds(matches);
      setSchedule(rounds);
    } catch (err) {
      console.error('Error fetching basketball schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const transformMatchesToRounds = (matches: any[]): ScheduleRound[] => {
    // Group matches by date
    const matchesByDate: Record<string, any[]> = {};
    
    matches.forEach(match => {
      const date = match.startTime.split('T')[0];
      if (!matchesByDate[date]) {
        matchesByDate[date] = [];
      }
      matchesByDate[date].push({
        id: match.id,
        home_team_name: match.homeTeam?.name || 'TBD',
        away_team_name: match.awayTeam?.name || 'TBD',
        scheduled_at: match.startTime,
        venue: match.venue,
        status: match.status,
        home_team_logo: match.homeTeam?.logo || null,
        away_team_logo: match.awayTeam?.logo || null
      });
    });

    // Convert to rounds format
    const rounds: ScheduleRound[] = Object.entries(matchesByDate).map(([date, matches], index) => ({
      round: index + 1,
      date,
      matches
    }));

    return rounds;
  };

  const refreshSchedule = () => {
    fetchSchedule();
  };

  return {
    schedule,
    loading,
    error,
    refreshSchedule
  };
};