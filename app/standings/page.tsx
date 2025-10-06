'use client';

import { useEffect, useState } from 'react';
import { getTeamsByCompetition } from '@/lib/userTeamService';
import { getMatchesByCompetition } from '@/lib/userMatchService';
import { Team } from '@/types/matchEvents';

// Define the structure for a single row in the standings table
interface StandingsEntry {
  rank: number;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const StandingsPage = () => {
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get competition ID from URL params or use default
  const searchParams = new URLSearchParams(window?.location?.search || '');
  const competitionId = searchParams.get('competition') || '1';

  useEffect(() => {
    const calculateStandings = async () => {
      try {
        // Fetch teams and matches using user-facing services
        const teams = await getTeamsByCompetition(competitionId);
        const matches = await getMatchesByCompetition(competitionId);

        // Initialize standings for each team
        const standingsMap: { [key: string]: StandingsEntry } = {};
        teams.forEach(team => {
          standingsMap[team.id] = {
            rank: 0,
            teamId: team.id,
            teamName: team.name,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };
        });

        // Process each match and update standings
        matches.forEach(match => {
          if (match.status !== 'full-time') return; // Only count finished matches

          const homeTeam = standingsMap[match.homeTeam];
          const awayTeam = standingsMap[match.awayTeam];
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;

          if (homeTeam) {
            homeTeam.played += 1;
            homeTeam.goalsFor += homeScore;
            homeTeam.goalsAgainst += awayScore;
          }
          if (awayTeam) {
            awayTeam.played += 1;
            awayTeam.goalsFor += awayScore;
            awayTeam.goalsAgainst += homeScore;
          }

          // Determine result
          if (homeScore > awayScore) {
            if (homeTeam) { homeTeam.wins += 1; homeTeam.points += 3; }
            if (awayTeam) { awayTeam.losses += 1; }
          } else if (homeScore < awayScore) {
            if (awayTeam) { awayTeam.wins += 1; awayTeam.points += 3; }
            if (homeTeam) { homeTeam.losses += 1; }
          } else {
            if (homeTeam) { homeTeam.draws += 1; homeTeam.points += 1; }
            if (awayTeam) { awayTeam.draws += 1; awayTeam.points += 1; }
          }
        });

        // Convert map to array and sort
        const sortedStandings = Object.values(standingsMap).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const aGD = a.goalsFor - a.goalsAgainst;
          const bGD = b.goalsFor - b.goalsAgainst;
          if (bGD !== aGD) return bGD - aGD;
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
          return a.teamName.localeCompare(b.teamName);
        });

        // Assign ranks
        const finalStandings = sortedStandings.map((entry, index) => ({
          ...entry,
          goalDifference: entry.goalsFor - entry.goalsAgainst,
          rank: index + 1,
        }));

        setStandings(finalStandings);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
      setLoading(false);
    };

    calculateStandings();
  }, [competitionId]);

  if (loading) {
    return <div className="text-center p-8">Loading standings...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">League Standings</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-center">P</th>
              <th className="px-4 py-2 text-center">W</th>
              <th className="px-4 py-2 text-center">D</th>
              <th className="px-4 py-2 text-center">L</th>
              <th className="px-4 py-2 text-center">GD</th>
              <th className="px-4 py-2 text-center font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map(entry => (
              <tr key={entry.teamId} className="border-t">
                <td className="px-4 py-2 text-center">{entry.rank}</td>
                <td className="px-4 py-2 font-medium">{entry.teamName}</td>
                <td className="px-4 py-2 text-center">{entry.played}</td>
                <td className="px-4 py-2 text-center">{entry.wins}</td>
                <td className="px-4 py-2 text-center">{entry.draws}</td>
                <td className="px-4 py-2 text-center">{entry.losses}</td>
                <td className="px-4 py-2 text-center">{entry.goalDifference}</td>
                <td className="px-4 py-2 text-center font-bold">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsPage;
