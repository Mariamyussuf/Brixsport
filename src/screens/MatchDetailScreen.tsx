'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Bell } from 'lucide-react';
import BrixSportsService from '@/services/BrixSportsService';
import { MatchWithEvents } from '@/types/brixsports';
import { useAuth } from '@/hooks/useAuth';
import { LoginPrompt } from '@/components/shared/LoginPrompt';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import IntelligentMatchHeader from '@/components/FootballScreen/IntelligentMatchHeader';
import { io } from 'socket.io-client';

interface MatchEventDisplay {
  id: number;
  minute: number;
  event_type: string;
  description: string;
  player_name?: string;
  team_name?: string;
}

const MatchDetailScreen: React.FC<{ matchId: number }> = ({ matchId }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [match, setMatch] = useState<MatchWithEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isScrolled } = useScrollDetection({ shrinkThreshold: 50, expandThreshold: 20 });

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) {
        setError('No match ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch match data using our new service
        const response = await BrixSportsService.getMatchById(matchId);
        
        if (response.success && response.data) {
          setMatch(response.data);
        } else {
          setError('Match details not available');
        }
      } catch (err: any) {
        console.error('Error fetching match data:', err);
        setError(err.message || 'Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  // Real-time updates using WebSocket
  useEffect(() => {
    if (!matchId || !match) return;

    // Connect to WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    
    // Join match room
    socket.emit('joinMatch', { matchId });
    
    // Listen for score updates
    socket.on('match:scoreUpdate', (update: any) => {
      setMatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          home_score: update.homeScore,
          away_score: update.awayScore,
          current_minute: update.currentMinute,
          period: update.period,
          status: update.status || prev.status
        };
      });
    });
    
    // Listen for new events
    socket.on('match:event', (newEvent: any) => {
      setMatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          events: [...prev.events, newEvent]
        };
      });
    });
    
    // Listen for match status updates
    socket.on('match:statusUpdate', (update: any) => {
      setMatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: update.status
        };
      });
    });
    
    // Cleanup function
    return () => {
      socket.emit('leaveMatch', { matchId });
      socket.disconnect();
    };
  }, [matchId, match]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Error Loading Match</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Match Details Not Available</h2>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const toggleFavorite = (): void => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    setIsFavorited(!isFavorited);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get event display info
  const getEventDisplay = (event: import('@/types/brixsports').LiveEvent) => {
    switch (event.event_type) {
      case 'goal':
        return { icon: '⚽', text: 'GOAL', color: 'bg-green-500' };
      case 'own_goal':
        return { icon: '⚽', text: 'OWN GOAL', color: 'bg-red-500' };
      case 'assist':
        return { icon: '🤝', text: 'ASSIST', color: 'bg-blue-500' };
      case 'substitution':
        return { icon: '🔄', text: 'SUBSTITUTION', color: 'bg-blue-500' };
      case 'yellow_card':
        return { icon: '🟨', text: 'YELLOW CARD', color: 'bg-yellow-500' };
      case 'red_card':
        return { icon: '🟥', text: 'RED CARD', color: 'bg-red-500' };
      case 'penalty':
        return { icon: '🥅', text: 'PENALTY', color: 'bg-purple-500' };
      case 'corner':
        return { icon: '🚩', text: 'CORNER', color: 'bg-orange-500' };
      case 'injury':
        return { icon: '🩹', text: 'INJURY', color: 'bg-red-500' };
      case 'foul':
        return { icon: '⚠️', text: 'FOUL', color: 'bg-yellow-500' };
      default:
        return { icon: '⚪', text: event.event_type.toUpperCase().replace('_', ' '), color: 'bg-gray-500' };
    }
  };

  // Sort events by minute
  const sortedEvents = [...match.events].sort((a, b) => a.minute - b.minute);

  return (
    <>
      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
        {/* Intelligent Header */}
        <IntelligentMatchHeader
          match={{
            id: match.id.toString(),
            homeTeam: {
              id: match.home_team_id.toString(),
              name: match.home_team_name || `Home Team ${match.home_team_id}`,
              logo: match.home_team_logo || ''
            },
            awayTeam: {
              id: match.away_team_id.toString(),
              name: match.away_team_name || `Away Team ${match.away_team_id}`,
              logo: match.away_team_logo || ''
            },
            homeScore: match.home_score,
            awayScore: match.away_score,
            time: match.status === 'live' ? "Live" : match.match_date,
            status: match.status,
            homeFlagColors: { top: 'bg-blue-600', bottom: 'bg-black' },
            awayFlagColors: { top: 'bg-red-600', bottom: 'bg-blue-600' },
            competition: match.competition_name || 'Competition',
            date: match.match_date,
            venue: match.venue || ''
          }}
          isFavorited={isFavorited}
          isScrolled={isScrolled}
          onBack={() => router.back()}
          onToggleFavorite={toggleFavorite}
        />

        {/* Match Info */}
        <div className="px-4 py-6 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-6">
              <div className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                {match.competition_name || 'Competition'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {formatDate(match.match_date)}
              </div>
              
              <div className="flex items-center justify-between w-full max-w-md">
                <div className="flex flex-col items-center">
                  {match.home_team_logo && (
                    <img 
                      src={match.home_team_logo} 
                      alt={match.home_team_name || `Home Team ${match.home_team_id}`} 
                      className="w-16 h-16 rounded-full mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="text-center font-bold">{match.home_team_name || `Home Team ${match.home_team_id}`}</div>
                </div>
                
                <div className="flex flex-col items-center mx-4">
                  <div className="text-3xl font-bold">
                    {match.status === 'completed' || match.status === 'live'
                      ? `${match.home_score} - ${match.away_score}`
                      : 'vs'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    match.status === 'scheduled' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                      : match.status === 'live' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {match.status.toUpperCase()}
                  </div>
                  {match.status === 'live' && (
                    <div className="flex items-center mt-1">
                      <span className="flex w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                      <span className="text-red-500 text-sm font-medium">
                        LIVE
                      </span>
                      {match.current_minute > 0 && (
                        <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">
                          {match.current_minute}' {match.period && `• ${match.period}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center">
                  {match.away_team_logo && (
                    <img 
                      src={match.away_team_logo} 
                      alt={match.away_team_name || `Away Team ${match.away_team_id}`} 
                      className="w-16 h-16 rounded-full mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="text-center font-bold">{match.away_team_name || `Away Team ${match.away_team_id}`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="px-4 py-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Match Events</h2>
            
            {sortedEvents.length > 0 ? (
              <div className="space-y-4">
                {sortedEvents.map((event) => {
                  const eventDisplay = getEventDisplay(event);
                  
                  return (
                    <div key={event.id} className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                          {event.minute}'
                        </div>
                      </div>
                      
                      <div className={`w-3 h-3 rounded-full ${eventDisplay.color} mr-3 mt-1`}></div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">
                            {eventDisplay.icon}
                          </span>
                          <div>
                            <p className="font-bold">
                              {eventDisplay.text}
                            </p>
                            {event.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No events recorded for this match</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchDetailScreen;