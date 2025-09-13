import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Star, AlertCircle, User } from 'lucide-react';
import SmartImage from '../shared/SmartImage';
import UserProfile from '../shared/UserProfile';
import { getTeamById } from '@/lib/userTeamService';
import { Player } from '@/types/matchEvents';

interface PlayerStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards?: number;
  minutesPlayed?: number;
  shotsOnTarget?: number;
  passAccuracy?: number;
}

interface TopScorer {
  id: number;
  name: string;
  teamName: string;
  teamLogo?: string;
  goals: number;
  isHighlighted?: boolean;
}

interface PlayerData {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  photoUrl: string;
  teamId?: string;
  teamName?: string;
  dateOfBirth?: string;
  nationality?: string;
  height?: number;
  weight?: number;
}

interface PlayerProfileProps {
  playerId: string;
  playerNumber?: number;
  playerName?: string;
  position?: string;
  playerImage?: string;
  onPlayerNotFound?: () => void;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({
  playerId,
  playerNumber,
  playerName,
  position,
  playerImage,
  onPlayerNotFound
}) => {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    gamesPlayed: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    yellowCards: 0,
    redCards: 0,
    minutesPlayed: 0,
    shotsOnTarget: 0,
    passAccuracy: 0
  });
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Memoized display data
  const displayData = useMemo(() => ({
    name: player?.name || playerName || "Unknown Player",
    number: player?.jerseyNumber || playerNumber || 0,
    position: player?.position || position || "Unknown Position",
    image: player?.photoUrl || playerImage || "",
    teamName: player?.teamName || "Unknown Team"
  }), [player, playerName, playerNumber, position, playerImage]);

  // API call functions
  const fetchPlayerById = useCallback(async (id: string): Promise<PlayerData | null> => {
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Player not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<PlayerData> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch player');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching player by ID:', error);
      return null;
    }
  }, []);

  const fetchPlayerFromTeams = useCallback(async (id: string): Promise<{ player: PlayerData | null; team: any | null }> => {
    try {
      const response = await fetch('/api/teams?include_players=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<any[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch teams');
      }
      
      for (const team of result.data) {
        const foundPlayer = team.players?.find((p: any) => p.id === id || p.id === parseInt(id));
        if (foundPlayer) {
          return {
            player: {
              ...foundPlayer,
              teamName: team.name,
              teamId: team.id
            },
            team
          };
        }
      }
      
      return { player: null, team: null };
    } catch (error) {
      console.error('Error fetching player from teams:', error);
      return { player: null, team: null };
    }
  }, []);

  const fetchPlayerStats = useCallback(async (id: string): Promise<PlayerStats> => {
    try {
      const response = await fetch(`/api/players/${id}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<PlayerStats> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch player stats');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }, []);

  const fetchTopScorers = useCallback(async (): Promise<TopScorer[]> => {
    try {
      const response = await fetch('/api/statistics/top-scorers?limit=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<TopScorer[]> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch top scorers');
      }
      
      // Highlight current player if they're in top scorers
      return result.data.map(scorer => ({
        ...scorer,
        isHighlighted: scorer.id === parseInt(playerId)
      }));
    } catch (error) {
      console.error('Error fetching top scorers:', error);
      throw error;
    }
  }, [playerId]);

  const checkIfFavorite = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/user/favorites/players/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.isFavorite || false;
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
    return false;
  }, []);

  const toggleFavorite = useCallback(async () => {
    if (!playerId) return;
    
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(`/api/user/favorites/players/${playerId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [playerId, isFavorite]);

  // Main data fetching effect
  useEffect(() => {
    const fetchAllData = async () => {
      if (!playerId) {
        setError('No player ID provided');
        setLoading(false);
        onPlayerNotFound?.();
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to fetch player directly first
        let playerData = await fetchPlayerById(playerId);
        
        // If direct fetch fails, try finding in teams
        if (!playerData) {
          const { player: teamPlayer } = await fetchPlayerFromTeams(playerId);
          playerData = teamPlayer;
        }

        if (!playerData) {
          throw new Error('Player not found');
        }

        setPlayer(playerData);

        // Fetch additional data in parallel
        const [stats, scorers, favorite] = await Promise.allSettled([
          fetchPlayerStats(playerId),
          fetchTopScorers(),
          checkIfFavorite(playerId)
        ]);

        // Handle stats result
        if (stats.status === 'fulfilled') {
          setPlayerStats(stats.value);
        } else {
          console.error('Failed to fetch player stats:', stats.reason);
          // Keep default empty stats state
        }

        // Handle top scorers result
        if (scorers.status === 'fulfilled') {
          setTopScorers(scorers.value);
        } else {
          console.error('Failed to fetch top scorers:', scorers.reason);
          // Keep empty array state
        }

        // Handle favorite status result
        if (favorite.status === 'fulfilled') {
          setIsFavorite(favorite.value);
        } else {
          console.error('Failed to check favorite status:', favorite.reason);
          // Keep false state
        }

      } catch (err: any) {
        console.error('Error fetching player data:', err);
        setError(err.message || 'Failed to load player data');
        onPlayerNotFound?.();
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [playerId, fetchPlayerById, fetchPlayerFromTeams, fetchPlayerStats, fetchTopScorers, checkIfFavorite, onPlayerNotFound]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div 
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            aria-hidden="true"
          ></div>
          <p className="text-gray-600 dark:text-gray-400">Loading player data...</p>
          <span className="sr-only">Loading</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl flex items-center justify-center">
        <div className="text-center p-4" role="alert">
          <div className="text-red-500 dark:text-red-400 mb-4" aria-hidden="true">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Player</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
            aria-label="Retry loading player data"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasStats = Object.values(playerStats).some(value => value > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-blue-900 to-blue-700 dark:from-blue-800 dark:to-blue-600 h-16 sm:h-20 md:h-24 lg:h-32 flex items-center justify-between px-3 sm:px-4 lg:px-8">
        <div className="absolute inset-0 bg-black bg-opacity-10 dark:bg-opacity-20"></div>
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}
             aria-hidden="true">
        </div>
        <button
          onClick={toggleFavorite}
          className={`z-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 rounded-full p-1 ${
            isFavorite 
              ? 'text-yellow-300 hover:text-yellow-200 active:scale-95' 
              : 'text-white hover:text-gray-200 active:scale-95'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          <Star 
            className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 ${isFavorite ? 'fill-current' : ''}`}
          />
        </button>
      </header>

      {/* Player Header */}
      <section className="bg-white dark:bg-gray-800 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
            <div 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold text-gray-800 dark:text-gray-200"
              aria-label={`Jersey number ${displayData.number}`}
            >
              {displayData.number}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white truncate">
                {displayData.name}
              </h1>
              <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-gray-500 dark:text-gray-400 capitalize">
                {displayData.position}
              </p>
            </div>
          </div>
          <UserProfile 
            playerImage={displayData.image} 
            playerName={displayData.name}
            aria-label={`${displayData.name} profile picture`}
          />
        </div>
      </section>

      {/* Desktop Layout - Two Columns */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-8">
        {/* Player Image */}
        <section className="px-3 sm:px-4 lg:px-0 py-4 sm:py-6" aria-labelledby="player-image">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
            <SmartImage 
              src={displayData.image} 
              alt={`${displayData.name} in action`}
              className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] object-cover"
              role="img"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true"></div>
          </div>
        </section>

        {/* Desktop Right Column - Stats and Top Scorers */}
        <div className="lg:py-6 lg:space-y-8">
          {/* Player Information */}
          <section className="px-3 sm:px-4 lg:px-0 pb-4 sm:pb-6 lg:pb-0" aria-labelledby="player-stats">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
              <h2 
                id="player-stats"
                className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 lg:mb-8"
              >
                Player Statistics
              </h2>
              
              {hasStats ? (
                <dl className="space-y-3 sm:space-y-4 lg:space-y-6">
                  <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                    <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Games played</dt>
                    <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.gamesPlayed}</dd>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                    <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Goals</dt>
                    <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.goals}</dd>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                    <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Assists</dt>
                    <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.assists}</dd>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                    <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Clean sheets</dt>
                    <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.cleanSheets}</dd>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                    <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Yellow cards</dt>
                    <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.yellowCards}</dd>
                  </div>
                  
                  {playerStats.redCards !== undefined && (
                    <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                      <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Red cards</dt>
                      <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.redCards}</dd>
                    </div>
                  )}
                  
                  {playerStats.minutesPlayed !== undefined && playerStats.minutesPlayed > 0 && (
                    <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 dark:border-gray-700">
                      <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Minutes played</dt>
                      <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.minutesPlayed.toLocaleString()}</dd>
                    </div>
                  )}
                  
                  {playerStats.passAccuracy !== undefined && playerStats.passAccuracy > 0 && (
                    <div className="flex justify-between items-center py-2 lg:py-3">
                      <dt className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Pass accuracy</dt>
                      <dd className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{playerStats.passAccuracy}%</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" aria-hidden="true" />
                  <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
                </div>
              )}
            </div>
          </section>

          {/* Top Scorers */}
          {topScorers.length > 0 && (
            <section className="px-3 sm:px-4 lg:px-0 pb-6 sm:pb-8 lg:pb-0" aria-labelledby="top-scorers">
              <h2 
                id="top-scorers"
                className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 lg:mb-6"
              >
                Top Scorers
              </h2>
              
              <ol className="space-y-2 lg:space-y-3" role="list">
                {topScorers.map((scorer, index) => (
                  <li 
                    key={scorer.id}
                    className={`flex items-center justify-between p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl transition-all duration-200 ${
                      scorer.isHighlighted 
                        ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    }`}
                    role="listitem"
                    aria-label={`${scorer.name} from ${scorer.teamName} with ${scorer.goals} goals, ranked ${index + 1}`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 min-w-0 flex-1">
                      <span 
                        className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold w-4 sm:w-6 lg:w-8 flex-shrink-0 ${
                          scorer.isHighlighted ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                        }`}
                        aria-label={`Position ${index + 1}`}
                      >
                        {index + 1}
                      </span>
                      
                      <div 
                        className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gray-800 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0"
                        aria-hidden="true"
                      >
                        {scorer.teamLogo ? (
                          <img 
                            src={scorer.teamLogo} 
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-4 h-3 sm:w-6 sm:h-4 lg:w-8 lg:h-6 bg-blue-600 dark:bg-blue-500 rounded-sm"></div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium text-sm sm:text-base lg:text-lg xl:text-xl truncate ${
                          scorer.isHighlighted ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          {scorer.name}
                        </div>
                        <div className={`text-xs sm:text-sm lg:text-base xl:text-lg truncate ${
                          scorer.isHighlighted ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {scorer.teamName}
                        </div>
                      </div>
                    </div>
                    
                    <span 
                      className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold flex-shrink-0 ml-2 ${
                        scorer.isHighlighted ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      aria-label={`${scorer.goals} goals`}
                    >
                      {scorer.goals}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;