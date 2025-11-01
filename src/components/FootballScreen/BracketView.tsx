"use client";
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy, Clock, Play, CheckCircle, Users, Target, Medal } from "lucide-react";
import { getTeamsByCompetition } from '@/lib/userTeamService';
import { getMatchesByCompetition } from '@/lib/userMatchService';
import { getCompetitionGroupStandings, getCompetitionKnockoutStructure, getGroupMatches, GroupWithStandings, KnockoutStage, KnockoutMatch } from '@/lib/competitionService';
import { useRealTimeTournamentUpdates } from '@/hooks/useRealTimeTournamentUpdates';
import { useI18nTournament, TranslationKey } from '@/hooks/useI18nTournament'; // Import TranslationKey type
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

// Match states
const MATCH_STATES = {
  DONE: 'SCORE_DONE',
  WALK_OVER: 'WALK_OVER', 
  NO_SHOW: 'NO_SHOW',
  RUNNING: 'RUNNING',
  SCHEDULED: 'SCHEDULED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED'
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
    postponed: isDark ? "#8b5cf6" : "#7c3aed",
    cancelled: isDark ? "#ef4444" : "#dc2626",
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
  logo?: string; // Add logo property
};

const GroupTable = ({
  group,
  onMatchClick,
  t,
  competitionId
}: {
  group: GroupWithStandings;
  onMatchClick: (match: any) => void;
  t: (key: TranslationKey) => string;
  competitionId: string;
}) => {
  const colors = useThemeColors();
  const [groupMatches, setGroupMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
  // Fetch group matches
  useEffect(() => {
    const fetchGroupMatches = async () => {
      if (!competitionId || !group.group_id) return;
      
      try {
        setLoadingMatches(true);
        const matches = await getGroupMatches(competitionId, group.group_id);
        
        // Sort by date to get most recent matches first
        const sortedMatches = [...matches].sort((a, b) => 
          new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
        ).slice(0, 5); // Get the 5 most recent matches
        
        setGroupMatches(sortedMatches);
      } catch (err) {
        console.error('Error fetching group matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    
    fetchGroupMatches();
  }, [group.group_id, competitionId]);
  
  const groupColors = {
    'A': colors.groupA,
    'B': colors.groupB, 
    'C': colors.groupC,
    'D': colors.groupD
  };

  // Calculate standings from matches
  const standings = useMemo(() => {
    return group.standings.map(standing => ({
      id: standing.team_id,
      name: standing.team_name,
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goalsFor: standing.goals_for,
      goalsAgainst: standing.goals_against,
      goalDifference: standing.goal_difference,
      points: standing.points,
      qualified: standing.position <= 2, // Top 2 teams qualify
      logo: standing.team_logo // Add logo
    }));
  }, [group.standings]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case MATCH_STATES.DONE:
        return <CheckCircle className="w-4 h-4" />;
      case MATCH_STATES.RUNNING:
        return <Play className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border overflow-hidden"
         style={{ borderColor: colors.border }}>
      {/* Group Header */}
      <div className="p-4 text-white font-bold text-center"
           style={{ backgroundColor: groupColors[group.group_name as 'A' | 'B' | 'C' | 'D'] || colors.accent }}>
        <div className="flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          <span>{t('group')} {group.group_name}</span>
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
                  <div className="flex items-center gap-2">
                    {team.logo && (
                      <img 
                        src={team.logo} 
                        alt={team.name} 
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <span className={`font-medium ${index < 2 ? 'font-bold' : ''}`}
                          style={{ color: colors.text }}>
                      {team.name}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.played}</td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.won}</td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.drawn}</td>
                <td className="p-2 text-center" style={{ color: colors.textSecondary }}>{team.lost}</td>
                <td className="p-2 text-center font-mono" 
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
        <h4 className="font-semibold text-sm mb-3" style={{ color: colors.text }}>{t('recentMatches')}</h4>
        {loadingMatches ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : groupMatches.length > 0 ? (
          groupMatches.map((match) => (
            <div 
              key={match.id}
              className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-opacity-50 transition-colors"
              style={{ backgroundColor: colors.surface }}
              onClick={() => onMatchClick(match)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {getStatusIcon(match.status)}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  {match.home_team_logo && (
                    <img 
                      src={match.home_team_logo} 
                      alt={match.home_team_name} 
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-xs truncate" style={{ color: colors.text }}>
                    {match.home_team_name}
                  </span>
                </div>
                <span className="text-xs font-bold mx-1" style={{ color: colors.textSecondary }}>
                  {match.status === MATCH_STATES.DONE ? match.home_score : '-'}
                </span>
              </div>
              
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                {formatDate(match.match_date)}
              </div>
              
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-xs font-bold mx-1" style={{ color: colors.textSecondary }}>
                  {match.status === MATCH_STATES.DONE ? match.away_score : '-'}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs truncate" style={{ color: colors.text }}>
                    {match.away_team_name}
                  </span>
                  {match.away_team_logo && (
                    <img 
                      src={match.away_team_logo} 
                      alt={match.away_team_name} 
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-2" style={{ color: colors.textSecondary }}>
            <p className="text-xs">{t('noData')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Knockout Match Component
const Match = ({ match, onMatchClick, onPartyClick, style = {}, realTimeUpdate, t, formatRoundName, formatMatchStatus }: {
  match: KnockoutMatch;
  onMatchClick?: (match: KnockoutMatch) => void;
  onPartyClick?: (party: any, match: KnockoutMatch) => void;
  style?: React.CSSProperties;
  realTimeUpdate?: any;
  t: (key: TranslationKey) => string; // Use the imported TranslationKey type
  formatRoundName: (round: string) => string;
  formatMatchStatus: (status: string) => string;
}) => {
  const colors = useThemeColors();
  
  // Use real-time update if available
  const displayMatch = realTimeUpdate ? {
    ...match,
    home_score: realTimeUpdate.homeScore !== undefined ? realTimeUpdate.homeScore : match.home_score,
    away_score: realTimeUpdate.awayScore !== undefined ? realTimeUpdate.awayScore : match.away_score,
    status: realTimeUpdate.status || match.status,
  } : match;
  
  const getStatusIcon = () => {
    switch (displayMatch.status) {
      case MATCH_STATES.DONE:
        return <CheckCircle className="w-4 h-4" />;
      case MATCH_STATES.RUNNING:
        return <Play className="w-4 h-4" />;
      case MATCH_STATES.POSTPONED:
        return <Clock className="w-4 h-4" />;
      case MATCH_STATES.CANCELLED:
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (displayMatch.status) {
      case MATCH_STATES.DONE:
        return colors.winner;
      case MATCH_STATES.RUNNING:
        return colors.running;
      case MATCH_STATES.POSTPONED:
        return colors.postponed;
      case MATCH_STATES.CANCELLED:
        return colors.cancelled;
      default:
        return colors.scheduled;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="absolute transition-all duration-300 hover:scale-105 hover:z-10"
      style={{
        ...style,
        width: '260px',
        minHeight: '140px'
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
            <div className="text-sm font-semibold">
              {formatRoundName(displayMatch.round)}
            </div>
          </div>
          <div className="text-xs opacity-90">{formatDate(displayMatch.match_date)}</div>
        </div>

        <div className="p-3 space-y-2">
          <div 
            className={`flex justify-between items-center p-2 rounded transition-all duration-200`}
            style={{
              backgroundColor: colors.surface,
              color: colors.text
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPartyClick?.(displayMatch.home_team, displayMatch);
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {displayMatch.home_team.team_logo && (
                <img 
                  src={displayMatch.home_team.team_logo} 
                  alt={displayMatch.home_team.team_name} 
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span className="text-sm font-medium truncate">
                {displayMatch.home_team.team_name || 'TBD'}
              </span>
            </div>
            <span className="text-sm font-bold ml-2" style={{ color: colors.textSecondary }}>
              {displayMatch.home_score !== undefined ? displayMatch.home_score : '-'}
            </span>
          </div>
          
          <div 
            className={`flex justify-between items-center p-2 rounded transition-all duration-200`}
            style={{
              backgroundColor: colors.surface,
              color: colors.text
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPartyClick?.(displayMatch.away_team, displayMatch);
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {displayMatch.away_team.team_logo && (
                <img 
                  src={displayMatch.away_team.team_logo} 
                  alt={displayMatch.away_team.team_name} 
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span className="text-sm font-medium truncate">
                {displayMatch.away_team.team_name || 'TBD'}
              </span>
            </div>
            <span className="text-sm font-bold ml-2" style={{ color: colors.textSecondary }}>
              {displayMatch.away_score !== undefined ? displayMatch.away_score : '-'}
            </span>
          </div>
        </div>

        <div className="px-3 pb-2">
          <div 
            className="text-xs text-center py-1 px-2 rounded font-medium"
            style={{ 
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor()
            }}
          >
            {formatMatchStatus(displayMatch.status)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Bracket layout calculation
const calculateBracketLayout = (knockoutStage: KnockoutStage) => {
  const matches: KnockoutMatch[] = [
    ...knockoutStage.round_of_16,
    ...knockoutStage.quarter_finals,
    ...knockoutStage.semi_finals,
    ...(knockoutStage.final ? [knockoutStage.final] : [])
  ];
  
  const matchMap = new Map<string, KnockoutMatch>();
  const children = new Map<string, string[]>();
  
  matches.forEach(match => {
    matchMap.set(match.match_id, match);
  });

  // Build parent-child relationships based on match sources
  matches.forEach(match => {
    // Extract source information to build parent-child relationships
    // Sources are in format like "group_A_1", "group_B_2", "winner_123", etc.
    
    // For this implementation, we'll identify parent matches based on the source references
    // This is a simplified approach - in a production system, this would be more robust
    
    // Add match to the map
    matchMap.set(match.match_id, match);
  });

  const MATCH_WIDTH = 260;
  const MATCH_HEIGHT = 160;
  const ROUND_GAP = 150;
  const VERTICAL_SPACING = 80;

  const layout = {
    matches: new Map<string, { x: number; y: number; match: KnockoutMatch }>(),
    connections: [] as any[],
    totalWidth: 0,
    totalHeight: 0
  };

  // Define rounds in proper tournament order
  const rounds = [
    knockoutStage.round_of_16,
    knockoutStage.quarter_finals,
    knockoutStage.semi_finals,
    knockoutStage.final ? [knockoutStage.final] : []
  ];

  // Calculate positions for each round
  rounds.forEach((roundMatches, roundIndex) => {
    const roundX = roundIndex * (MATCH_WIDTH + ROUND_GAP);
    
    // Calculate vertical positioning to center each round
    const totalHeight = roundMatches.length * MATCH_HEIGHT + (roundMatches.length - 1) * VERTICAL_SPACING;
    const startY = Math.max(0, (800 - totalHeight) / 2);
    
    roundMatches.forEach((match, matchIndex) => {
      // Calculate vertical position with proper spacing
      const y = startY + matchIndex * (MATCH_HEIGHT + VERTICAL_SPACING);
      
      layout.matches.set(match.match_id, {
        x: roundX,
        y: y,
        match: match
      });
    });
  });

  // Create connections between rounds based on actual match relationships
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];
    
    // Connect matches from current round to next round
    currentRound.forEach((match, index) => {
      const currentPos = layout.matches.get(match.match_id);
      if (!currentPos) return;
      
      // Find the next match that this match connects to
      // In a tournament bracket, every 2 matches in a round connect to 1 match in the next round
      const nextMatchIndex = Math.floor(index / 2);
      
      if (nextMatchIndex < nextRound.length) {
        const nextMatch = nextRound[nextMatchIndex];
        const nextPos = layout.matches.get(nextMatch.match_id);
        
        if (nextPos) {
          // Calculate connection path
          const startX = currentPos.x + MATCH_WIDTH;
          const startY = currentPos.y + MATCH_HEIGHT / 2;
          const endX = nextPos.x;
          const endY = nextPos.y + MATCH_HEIGHT / 2;
          const midX = startX + ROUND_GAP / 2;
          
          layout.connections.push({
            id: `${match.match_id}-${nextMatch.match_id}`,
            path: `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`,
            fromMatch: match.match_id,
            toMatch: nextMatch.match_id
          });
        }
      }
    });
  }

  // Calculate total dimensions
  layout.totalWidth = Math.max(800, rounds.length * (MATCH_WIDTH + ROUND_GAP));
  layout.totalHeight = Math.max(600, ...rounds.map(r => 
    r.length * (MATCH_HEIGHT + VERTICAL_SPACING) + 200
  ));

  return layout;
};

// Main Tournament Component
export default function TournamentView({ competitionId }: { competitionId: string }) {
  const colors = useThemeColors();
  const containerRef = useRef(null);
  const [selectedMatch, setSelectedMatch] = useState<KnockoutMatch | null>(null);
  const [currentPhase, setCurrentPhase] = useState(TOURNAMENT_PHASES.GROUP);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [groups, setGroups] = useState<GroupWithStandings[]>([]);
  const [knockoutStage, setKnockoutStage] = useState<KnockoutStage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Add router for navigation
  
  // Use internationalization
  const { t, formatRoundName, formatMatchStatus } = useI18nTournament();
  
  // Use real-time updates
  const { matchUpdates, connectionStatus } = useRealTimeTournamentUpdates(competitionId);

  // Fetch real tournament data
  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!competitionId) {
        setError(t('errorLoading'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch group standings and knockout structure in parallel
        const [groupStandings, knockoutStructure] = await Promise.all([
          getCompetitionGroupStandings(competitionId),
          getCompetitionKnockoutStructure(competitionId)
        ]);

        setGroups(groupStandings);
        setKnockoutStage(knockoutStructure);
      } catch (err: any) {
        console.error('Error fetching tournament data:', err);
        setError(err.message || t('errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [competitionId, t]);

  const knockoutLayout = useMemo(() => 
    knockoutStage ? calculateBracketLayout(knockoutStage) : null, 
    [knockoutStage]
  );

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current as HTMLDivElement | null;
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
    (containerRef.current as HTMLDivElement | null)?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    (containerRef.current as HTMLDivElement | null)?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: colors.text }}>{t('loading')}</p>
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
          <h3 className="text-xl font-medium mb-2" style={{ color: colors.text }}>{t('errorLoading')}</h3>
          <p style={{ color: colors.textSecondary }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {t('retry')}
          </button>
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
            {t('tournamentSystem')}
          </h1>
          
          {/* Connection status indicator */}
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: connectionStatus === 'connected' ? colors.winner : 
                               connectionStatus === 'connecting' ? colors.running : colors.cancelled 
              }}
            />
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {connectionStatus === 'connected' ? t('connectionLive') : 
               connectionStatus === 'connecting' ? t('connectionConnecting') : t('connectionDisconnected')}
            </span>
          </div>
          
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
              {t('groupStage')}
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
              {t('knockout')}
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
              {groups.map((group) => (
                <GroupTable
                  key={group.group_id}
                  group={group}
                  onMatchClick={setSelectedMatch}
                  t={t}
                  competitionId={competitionId}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Knockout Stage View */
          <>
            {knockoutLayout && knockoutLayout.totalWidth > 800 && (
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
              </>
            )}

            <div 
              ref={containerRef}
              className="w-full h-full overflow-auto p-8"
              style={{ backgroundColor: colors.background }}
            >
              {knockoutLayout ? (
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
                      key={match.match_id}
                      match={match}
                      style={{ left: x, top: y, zIndex: 2 }}
                      onMatchClick={setSelectedMatch}
                      onPartyClick={(party, match) => {
                        // Navigate to team details page
                        if (party && party.team_id) {
                          router.push(`/teams/test-team-detail?page=1`);
                        }
                      }}
                      realTimeUpdate={matchUpdates[match.match_id]}
                      t={t}
                      formatRoundName={formatRoundName}
                      formatMatchStatus={formatMatchStatus}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center" style={{ color: colors.textSecondary }}>
                    <p>{t('noData')}</p>
                  </div>
                </div>
              )}
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
            <h3 className="font-bold text-lg">{formatRoundName(selectedMatch.round)}</h3>
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
              <strong>{t('venue')}:</strong> {selectedMatch.venue}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              <strong>{t('status')}:</strong> {formatMatchStatus(selectedMatch.status)}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{t('participants')}:</h4>
            <div className="flex justify-between items-center text-sm p-2 rounded"
                 style={{ backgroundColor: colors.surface }}>
              <div className="flex items-center gap-2">
                {selectedMatch.home_team.team_logo && (
                  <img 
                    src={selectedMatch.home_team.team_logo} 
                    alt={selectedMatch.home_team.team_name} 
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span>{selectedMatch.home_team.team_name || 'TBD'}</span>
              </div>
              <span className="font-mono">
                {selectedMatch.home_score !== undefined ? selectedMatch.home_score : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 rounded"
                 style={{ backgroundColor: colors.surface }}>
              <div className="flex items-center gap-2">
                {selectedMatch.away_team.team_logo && (
                  <img 
                    src={selectedMatch.away_team.team_logo} 
                    alt={selectedMatch.away_team.team_name} 
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span>{selectedMatch.away_team.team_name || 'TBD'}</span>
              </div>
              <span className="font-mono">
                {selectedMatch.away_score !== undefined ? selectedMatch.away_score : '-'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}