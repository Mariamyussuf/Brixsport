"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy, Clock, Play, CheckCircle, Users, Target, Medal } from "lucide-react";
import { getTeamsByCompetition } from '@/lib/userTeamService';
import { getMatchesByCompetition } from '@/lib/userMatchService';

// Match states
const MATCH_STATES = {
  DONE: 'SCORE_DONE',
  WALK_OVER: 'WALK_OVER', 
  NO_SHOW: 'NO_SHOW',
  RUNNING: 'RUNNING',
  SCHEDULED: 'SCHEDULED'
};

// Tournament phases
const TOURNAMENT_PHASES = {
  GROUP: 'GROUP_STAGE',
  KNOCKOUT: 'KNOCKOUT'
};

// Custom hook for theme-aware colors
const useThemeColors = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark') || 
                window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  return {
    background: isDark ? "#0f172a" : "#ffffff",
    surface: isDark ? "#1e293b" : "#f8fafc", 
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f1f5f9" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    line: isDark ? "#475569" : "#cbd5e1",
    winner: isDark ? "#22c55e" : "#16a34a",
    qualified: isDark ? "#3b82f6" : "#2563eb",
    eliminated: isDark ? "#ef4444" : "#dc2626",
    scheduled: isDark ? "#6b7280" : "#9ca3af",
    running: isDark ? "#f59e0b" : "#d97706",
    accent: "#3b82f6",
    groupA: "#8b5cf6",
    groupB: "#06b6d4", 
    groupC: "#10b981",
    groupD: "#f59e0b",
    isDark
  };
};

// Group Stage Table Component
type TeamStanding = {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualified: boolean;
};

const GroupTable = ({
  group,
  onMatchClick,
}: {
  group: {
    name: string;
    matches: Array<{
      id: string;
      name: string;
      participants: Array<{
        id: string;
        name: string;
        resultText?: string;
        isWinner?: boolean;
        qualified?: boolean;
      }>;
      state: string;
    }>;
  };
  onMatchClick: (match: any) => void;
}) => {
  const colors = useThemeColors();
  
  const groupColors = {
    'A': colors.groupA,
    'B': colors.groupB, 
    'C': colors.groupC,
    'D': colors.groupD
  };

  // Calculate standings from matches
  const standings = useMemo(() => {
    const teams: { [id: string]: TeamStanding } = {};
    
    // Initialize teams
    group.matches.forEach(match => {
      match.participants.forEach(p => {
        if (!teams[p.id]) {
          teams[p.id] = {
            id: p.id,
            name: p.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            qualified: p.qualified || false
          };
        }
      });
    });

    // Calculate from completed matches
    group.matches.forEach(match => {
      if (match.state === MATCH_STATES.DONE) {
        const [p1, p2] = match.participants;
        const score1 = parseInt(p1.resultText) || 0;
        const score2 = parseInt(p2.resultText) || 0;
        
        teams[p1.id].played++;
        teams[p2.id].played++;
        teams[p1.id].goalsFor += score1;
        teams[p1.id].goalsAgainst += score2;
        teams[p2.id].goalsFor += score2;
        teams[p2.id].goalsAgainst += score1;
        
        if (score1 > score2) {
          teams[p1.id].won++;
          teams[p1.id].points += 3;
          teams[p2.id].lost++;
        } else if (score2 > score1) {
          teams[p2.id].won++;
          teams[p2.id].points += 3;
          teams[p1.id].lost++;
        } else {
          teams[p1.id].drawn++;
          teams[p2.id].drawn++;
          teams[p1.id].points++;
          teams[p2.id].points++;
        }
      }
    });

    // Calculate goal difference and sort
    Object.values(teams).forEach((team: TeamStanding) => {
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    });

    return Object.values(teams).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }, [group.matches]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border overflow-hidden"
         style={{ borderColor: colors.border }}>
      {/* Group Header */}
      <div className="p-4 text-white font-bold text-center"
           style={{ backgroundColor: groupColors[group.name] || colors.accent }}>
        <div className="flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          <span>Group {group.name}</span>
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: colors.surface }}>
            <tr className="text-left">
              <th className="p-2 font-semibold" style={{ color: colors.text }}>#</th>
              <th className="p-2 font-semibold" style={{ color: colors.text }}>Team</th>
              <th className="p-2 font-semibold text-center" style={{ color: colors.text }}>P</th>
              <th className="p-2 font-semibold text-center" style={{ color: colors.text }}>W</th>
              <th className="p-2 font-semibold text-center" style={{ color: colors.text }}>D</th>
              <th className="p-2 font-semibold text-center" style={{ color: colors.text }}>L</th>
              <th className="p-2 font-semibold text-center" style={{ color: colors.text }}>GD</th>
              <th className="p-2 font-semibold text-center" style={{ color: colors.text }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.id} 
                  className={`border-t hover:bg-opacity-50 transition-colors ${
                    index < 2 ? 'bg-green-50 dark:bg-green-900/20' : 
                    index >= standings.length - 1 ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                  style={{ borderColor: colors.border }}>
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <span style={{ color: colors.text }}>{index + 1}</span>
                    {index < 2 && <Medal className="w-4 h-4" style={{ color: colors.qualified }} />}
                  </div>
                </td>
                <td className="p-2">
                  <span className={`font-medium ${index < 2 ? 'font-bold' : ''}`}
                        style={{ color: colors.text }}>
                    {team.name}
                  </span>
                </td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.played}</td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.won}</td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.drawn}</td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.lost}</td>
                <td className={`p-2 text-center font-mono ${team.goalDifference > 0 ? 'font-bold' : ''}`}
                    style={{ color: team.goalDifference > 0 ? colors.winner : 
                                   team.goalDifference < 0 ? colors.eliminated : colors.textSecondary }}>
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
                <td className="p-2 text-center font-bold" 
                    style={{ color: index < 2 ? colors.qualified : colors.text }}>
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Group Matches */}
      <div className="p-4 space-y-2">
        <h4 className="font-semibold text-sm mb-3" style={{ color: colors.text }}>Recent Matches</h4>
        {group.matches.slice(-3).map(match => (
          <div key={match.id} 
               className="flex items-center justify-between p-2 rounded border cursor-pointer hover:shadow-md transition-all"
               style={{ backgroundColor: colors.surface, borderColor: colors.border }}
               onClick={() => onMatchClick(match)}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full`} 
                   style={{ backgroundColor: 
                     match.state === MATCH_STATES.DONE ? colors.winner :
                     match.state === MATCH_STATES.RUNNING ? colors.running : colors.scheduled 
                   }} />
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {match.name}
              </span>
            </div>
            <div className="text-xs" style={{ color: colors.text }}>
              {match.participants[0]?.name?.split(' ').pop()} {match.participants[0]?.resultText || '-'} : {match.participants[1]?.resultText || '-'} {match.participants[1]?.name?.split(' ').pop()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Knockout Match Component (reusing from previous)
const Match = ({ match, onMatchClick, onPartyClick, style = {} }) => {
  const colors = useThemeColors();
  
  const getStatusIcon = () => {
    switch (match.state) {
      case MATCH_STATES.DONE:
        return <CheckCircle className="w-4 h-4" />;
      case MATCH_STATES.RUNNING:
        return <Play className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (match.state) {
      case MATCH_STATES.DONE:
        return colors.winner;
      case MATCH_STATES.RUNNING:
        return colors.running;
      default:
        return colors.scheduled;
    }
  };

  return (
    <div 
      className="absolute transition-all duration-300 hover:scale-105 hover:z-10"
      style={{
        ...style,
        width: '240px',
        minHeight: '120px'
      }}
    >
      <div 
        className="rounded-lg shadow-lg border-2 cursor-pointer overflow-hidden"
        style={{ 
          backgroundColor: colors.background,
          borderColor: colors.border,
          boxShadow: colors.isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
        }}
        onClick={() => onMatchClick?.(match)}
      >
        <div 
          className="text-white text-center py-2 px-3"
          style={{ backgroundColor: colors.accent }}
        >
          <div className="flex items-center justify-center gap-2">
            <div style={{ color: getStatusColor() }}>
              {getStatusIcon()}
            </div>
            <div className="text-sm font-semibold">{match.name}</div>
          </div>
          <div className="text-xs opacity-90">{match.tournamentRoundText}</div>
        </div>

        <div className="p-3 space-y-2">
          {match.participants.map((participant, index) => (
            <div 
              key={participant.id || index}
              className={`flex justify-between items-center p-2 rounded transition-all duration-200 ${
                participant.isWinner ? 'ring-2' : 'hover:scale-[1.02]'
              }`}
              style={{
                backgroundColor: participant.isWinner ? 
                  `${colors.winner}15` : colors.surface,
                color: colors.text
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPartyClick?.(participant, match);
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {participant.isWinner && (
                  <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: colors.winner }} />
                )}
                <span className={`text-sm font-medium truncate ${
                  participant.isWinner ? 'font-bold' : ''
                }`}>
                  {participant.name || 'TBD'}
                </span>
              </div>
              <span className={`text-sm font-bold ml-2 ${
                participant.isWinner ? 'font-black' : ''
              }`} style={{ 
                color: participant.isWinner ? colors.winner : colors.textSecondary 
              }}>
                {participant.resultText || '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="px-3 pb-2">
          <div 
            className="text-xs text-center py-1 px-2 rounded font-medium"
            style={{ 
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor()
            }}
          >
            {match.state === MATCH_STATES.DONE ? 'Completed' :
             match.state === MATCH_STATES.RUNNING ? 'Live' : 
             'Scheduled'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Bracket layout calculation (same as before)
const calculateBracketLayout = (matches) => {
  const matchMap = new Map();
  const children = new Map();
  
  matches.forEach(match => {
    matchMap.set(match.id, match);
    if (match.nextMatchId) {
      if (!children.has(match.nextMatchId)) {
        children.set(match.nextMatchId, []);
      }
      children.get(match.nextMatchId).push(match.id);
    }
  });

  const rounds = [];
  const visited = new Set();
  const finals = matches.filter(m => !m.nextMatchId);
  
  const buildRounds = (matchIds, roundIndex = 0) => {
    if (!matchIds.length) return;
    
    const currentMatches = matchIds
      .filter(id => !visited.has(id))
      .map(id => matchMap.get(id))
      .filter(Boolean);
    
    if (!currentMatches.length) return;
    
    currentMatches.forEach(m => visited.add(m.id));
    
    if (!rounds[roundIndex]) rounds[roundIndex] = [];
    rounds[roundIndex].push(...currentMatches);
    
    const prevRoundIds = currentMatches
      .flatMap(match => children.get(match.id) || []);
    
    if (prevRoundIds.length > 0) {
      buildRounds(prevRoundIds, roundIndex + 1);
    }
  };

  buildRounds(finals.map(f => f.id));
  rounds.reverse();

  const MATCH_WIDTH = 240;
  const MATCH_HEIGHT = 140;
  const ROUND_GAP = 120;
  const VERTICAL_SPACING = 60;

  const layout = {
    matches: new Map(),
    connections: [],
    totalWidth: 0,
    totalHeight: 0
  };

  rounds.forEach((roundMatches, roundIndex) => {
    const roundX = roundIndex * (MATCH_WIDTH + ROUND_GAP);
    const roundHeight = roundMatches.length * (MATCH_HEIGHT + VERTICAL_SPACING);
    const startY = Math.max(0, (600 - roundHeight) / 2);
    
    roundMatches.forEach((match, matchIndex) => {
      const y = startY + matchIndex * (MATCH_HEIGHT + VERTICAL_SPACING);
      
      layout.matches.set(match.id, {
        x: roundX,
        y: y,
        match: match
      });
    });
  });

  rounds.forEach((roundMatches, roundIndex) => {
    if (roundIndex >= rounds.length - 1) return;
    
    roundMatches.forEach((match) => {
      if (!match.nextMatchId) return;
      
      const currentPos = layout.matches.get(match.id);
      const nextPos = layout.matches.get(match.nextMatchId);
      
      if (currentPos && nextPos) {
        const startX = currentPos.x + MATCH_WIDTH;
        const startY = currentPos.y + MATCH_HEIGHT / 2;
        const endX = nextPos.x;
        const endY = nextPos.y + MATCH_HEIGHT / 2;
        const midX = startX + ROUND_GAP / 2;
        
        layout.connections.push({
          id: `${match.id}-${match.nextMatchId}`,
          path: `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`,
          fromMatch: match.id,
          toMatch: match.nextMatchId
        });
      }
    });
  });

  layout.totalWidth = rounds.length * (MATCH_WIDTH + ROUND_GAP);
  layout.totalHeight = Math.max(...rounds.map(r => 
    r.length * (MATCH_HEIGHT + VERTICAL_SPACING) + 100
  ));

  return layout;
};

// Main Tournament Component
export default function TournamentView({ competitionId }: { competitionId: string }) {
  const colors = useThemeColors();
  const containerRef = useRef(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(TOURNAMENT_PHASES.GROUP);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real tournament data
  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!competitionId) {
        setError('No competition ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch teams and matches for the competition
        const [teams, matches] = await Promise.all([
          getTeamsByCompetition(competitionId),
          getMatchesByCompetition(competitionId)
        ]);

        // Group teams into groups (this is a simplified approach)
        // In a real implementation, you would have group information in the data
        const groupsData = [];
        const teamsPerGroup = Math.ceil(teams.length / 4); // 4 groups max
        
        for (let i = 0; i < Math.min(4, Math.ceil(teams.length / teamsPerGroup)); i++) {
          const groupTeams = teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
          groupsData.push({
            name: String.fromCharCode(65 + i), // A, B, C, D
            teams: groupTeams,
            matches: matches.filter(match => 
              groupTeams.some(team => team.id === match.homeTeam || team.id === match.awayTeam)
            ).map(match => ({
              id: match.id,
              name: `Match ${match.id.slice(0, 8)}`,
              participants: [
                { 
                  id: match.homeTeam, 
                  name: teams.find(t => t.id === match.homeTeam)?.name || 'Home Team', 
                  resultText: match.homeScore?.toString() || (match.status === 'full-time' ? '0' : undefined),
                  isWinner: match.status === 'full-time' && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore,
                  qualified: false // This would be determined by standings
                },
                { 
                  id: match.awayTeam, 
                  name: teams.find(t => t.id === match.awayTeam)?.name || 'Away Team', 
                  resultText: match.awayScore?.toString() || (match.status === 'full-time' ? '0' : undefined),
                  isWinner: match.status === 'full-time' && match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore,
                  qualified: false // This would be determined by standings
                }
              ],
              state: match.status === 'scheduled' ? MATCH_STATES.SCHEDULED : 
                     match.status === 'live' ? MATCH_STATES.RUNNING : 
                     match.status === 'full-time' ? MATCH_STATES.DONE : MATCH_STATES.SCHEDULED
            }))
          });
        }

        setGroups(groupsData);

        // For knockout matches, we'll use a subset of matches as an example
        // In a real implementation, you would have specific knockout stage matches
        const knockoutMatchesData = matches.slice(0, 4).map((match, index) => ({
          id: match.id,
          name: `Knockout ${index + 1}`,
          nextMatchId: index < 3 ? matches[index + 1]?.id : null,
          tournamentRoundText: index < 2 ? "Round of 16" : index < 3 ? "Quarter Final" : "Semi Final",
          startTime: match.date,
          state: match.status === 'scheduled' ? MATCH_STATES.SCHEDULED : 
                 match.status === 'live' ? MATCH_STATES.RUNNING : 
                 match.status === 'full-time' ? MATCH_STATES.DONE : MATCH_STATES.SCHEDULED,
          participants: [
            { 
              id: match.homeTeam, 
              name: teams.find(t => t.id === match.homeTeam)?.name || 'Home Team', 
              resultText: match.homeScore?.toString() || (match.status === 'full-time' ? '0' : null),
              isWinner: match.status === 'full-time' && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore,
              status: match.status === 'scheduled' ? "QUALIFIED" : 
                     match.status === 'live' ? "PLAYING" : 
                     match.status === 'full-time' ? "PLAYED" : "PENDING"
            },
            { 
              id: match.awayTeam, 
              name: teams.find(t => t.id === match.awayTeam)?.name || 'Away Team', 
              resultText: match.awayScore?.toString() || (match.status === 'full-time' ? '0' : null),
              isWinner: match.status === 'full-time' && match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore,
              status: match.status === 'scheduled' ? "QUALIFIED" : 
                     match.status === 'live' ? "PLAYING" : 
                     match.status === 'full-time' ? "PLAYED" : "PENDING"
            },
          ],
        }));

        setKnockoutMatches(knockoutMatchesData);
      } catch (err: any) {
        console.error('Error fetching tournament data:', err);
        setError(err.message || 'Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [competitionId]);

  const tournamentData = useMemo(() => ({
    groups: groups,
    knockoutMatches: knockoutMatches
  }), [groups, knockoutMatches]);

  const knockoutLayout = useMemo(() => 
    calculateBracketLayout(tournamentData.knockoutMatches), 
    [tournamentData.knockoutMatches]
  );

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    };

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    return () => container.removeEventListener('scroll', updateScrollButtons);
  }, []);

  const scrollLeft = () => {
    containerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    containerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: colors.text }}>Loading tournament data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="text-center p-4">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2" style={{ color: colors.text }}>Error Loading Tournament</h3>
          <p style={{ color: colors.textSecondary }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col" style={{ backgroundColor: colors.surface }}>
      {/* Header with Phase Toggle */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            Tournament System
          </h1>
          
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentPhase(TOURNAMENT_PHASES.GROUP)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentPhase === TOURNAMENT_PHASES.GROUP ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: currentPhase === TOURNAMENT_PHASES.GROUP ? colors.accent : 'transparent',
                color: currentPhase === TOURNAMENT_PHASES.GROUP ? 'white' : colors.text
              }}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Group Stage
            </button>
            <button
              onClick={() => setCurrentPhase(TOURNAMENT_PHASES.KNOCKOUT)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                currentPhase === TOURNAMENT_PHASES.KNOCKOUT ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: currentPhase === TOURNAMENT_PHASES.KNOCKOUT ? colors.accent : 'transparent',
                color: currentPhase === TOURNAMENT_PHASES.KNOCKOUT ? 'white' : colors.text
              }}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Knockout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {currentPhase === TOURNAMENT_PHASES.GROUP ? (
          /* Group Stage View */
          <div 
            ref={containerRef}
            className="w-full h-full overflow-auto p-6"
            style={{ backgroundColor: colors.background }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {tournamentData.groups.map((group) => (
                <GroupTable
                  key={group.name}
                  group={group}
                  onMatchClick={setSelectedMatch}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Knockout Stage View */
          <>
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                style={{ backgroundColor: colors.accent, color: 'white' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                style={{ backgroundColor: colors.accent, color: 'white' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div 
              ref={containerRef}
              className="w-full h-full overflow-auto p-8"
              style={{ backgroundColor: colors.background }}
            >
              <div 
                className="relative"
                style={{ 
                  width: `${knockoutLayout.totalWidth}px`, 
                  height: `${Math.max(knockoutLayout.totalHeight, 600)}px`,
                  minWidth: '100%'
                }}
              >
                <svg 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  {knockoutLayout.connections.map((connection) => (
                    <path
                      key={connection.id}
                      d={connection.path}
                      stroke={colors.line}
                      strokeWidth="2"
                      fill="none"
                      className="transition-colors duration-300"
                    />
                  ))}
                </svg>

                {Array.from(knockoutLayout.matches.values()).map(({ x, y, match }) => (
                  <Match
                    key={match.id}
                    match={match}
                    style={{ left: x, top: y, zIndex: 2 }}
                    onMatchClick={setSelectedMatch}
                    onPartyClick={(party, match) => {
                      console.log('Party clicked:', party, 'in match:', match);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Match Detail */}
      {selectedMatch && (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-lg shadow-xl border p-4 z-30"
             style={{ 
               backgroundColor: colors.background, 
               borderColor: colors.border,
               color: colors.text 
             }}>
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">{selectedMatch.name}</h3>
            <button 
              onClick={() => setSelectedMatch(null)}
              className="text-xl hover:scale-110 transition-transform"
              style={{ color: colors.textSecondary }}
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              <strong>Round:</strong> {selectedMatch.tournamentRoundText || 'Group Stage'}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              <strong>Status:</strong> {selectedMatch.state?.replace('_', ' ') || 'Completed'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Participants:</h4>
            {selectedMatch.participants.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 rounded"
                   style={{ backgroundColor: colors.surface }}>
                <span className={p.isWinner ? 'font-bold' : ''}>
                  {p.isWinner && <Trophy className="inline w-4 h-4 mr-1" style={{ color: colors.winner }} />}
                  {p.name}
                </span>
                <span className="font-mono">{p.resultText || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}