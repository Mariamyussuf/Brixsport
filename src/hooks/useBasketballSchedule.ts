import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface ScheduleMatch {
  id: string;
  home_team_name: string;
  away_team_name: string;
  scheduled_at: string;
  venue: string;
  status: string;
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
          home_team_id,
          away_team_id,
          scheduled_at,
          venue,
          status,
          homeTeam:Team!home_team_id(name),
          awayTeam:Team!away_team_id(name)
        `)
        .eq('competition_id', competition.id)
        .order('scheduled_at', { ascending: true });

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
      const date = match.scheduled_at.split('T')[0];
      if (!matchesByDate[date]) {
        matchesByDate[date] = [];
      }
      matchesByDate[date].push({
        id: match.id,
        home_team_name: match.homeTeam?.name || 'TBD',
        away_team_name: match.awayTeam?.name || 'TBD',
        scheduled_at: match.scheduled_at,
        venue: match.venue,
        status: match.status
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