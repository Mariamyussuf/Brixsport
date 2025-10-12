import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from './I18nProvider';

export interface Match {
  id: string;
  // HomeScreen properties
  team1?: string;
  team2?: string;
  score1?: number;
  score2?: number;
  team1Color?: string;
  team2Color?: string;
  sportType?: string;
  // FixturesScreen properties
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  time?: string;
  status: 'live' | 'scheduled' | 'ended' | 'Live' | 'Upcoming' | 'Finished' | 'finished' | 'paused' | 'completed';
  quarter?: string;
  venue?: string;
  match_date?: string;
  sport?: string;
}

interface MatchCardProps {
  match: Match;
  isBasketball?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isBasketball = false }) => {
  const router = useRouter();
  const { t } = useI18n();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayHomeScore, setDisplayHomeScore] = useState(match.homeScore ?? match.score1 ?? 0);
  const [displayAwayScore, setDisplayAwayScore] = useState(match.awayScore ?? match.score2 ?? 0);

  // Handle score animations
  useEffect(() => {
    const newHomeScore = match.homeScore ?? match.score1 ?? 0;
    const newAwayScore = match.awayScore ?? match.score2 ?? 0;

    if (newHomeScore !== displayHomeScore || newAwayScore !== displayAwayScore) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayHomeScore(newHomeScore);
        setDisplayAwayScore(newAwayScore);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [match.homeScore, match.score1, match.awayScore, match.score2, displayHomeScore, displayAwayScore]);

  const getTeamIcon = (team: string | undefined, color?: string) => {
    // Handle case where team is undefined
    if (!team) {
      return (
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-300 dark:bg-gray-600">
          <div className="w-5 h-5 bg-white dark:bg-gray-800 rounded-sm opacity-80"></div>
        </div>
      );
    }
    
    const baseClasses = "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0";
    
    // Use provided color or fallback to team-based color
    const bgColor = color ? color : 
      (team.includes('Pirates') || team.includes('Los Blancos') || team.includes('Phoenix') || team.includes('Kings')) 
        ? 'bg-blue-600' 
        : 'bg-red-600';
    
    return (
      <div className={`${baseClasses} ${bgColor}`}>
        <div className="w-5 h-5 bg-white dark:bg-gray-800 rounded-sm opacity-80"></div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return 'bg-green-500';
      case 'scheduled':
      case 'upcoming':
        return 'bg-blue-500';
      case 'ended':
      case 'finished':
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-lg border border-gray-200 dark:border-gray-700 touch-manipulation cursor-pointer hover:shadow-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => {
        if (match.id) {
          router.push(`/match/${match.id}`);
        } else {
          router.push(`/match/1`);
        }
      }}
    >
      {/* Header with status and sport info */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <span className={`${getStatusColor(match.status)} text-white px-2 py-1 rounded-full text-xs font-medium ${match.status.toLowerCase() === 'live' ? 'animate-pulse' : ''}`}>
            {t(match.status.toLowerCase()) || match.status}
          </span>
          {match.sport && (
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
              {match.sport.charAt(0).toUpperCase() + match.sport.slice(1)}
            </span>
          )}
        </div>
        {match.match_date && (
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {formatDate(match.match_date)}
          </span>
        )}
      </div>
      
      {/* Teams and scores */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getTeamIcon(match.homeTeam || match.team1, match.team1Color)}
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">
            {match.homeTeam || match.team1 || 'Home Team'}
          </span>
        </div>
        
        <div className="px-4 min-w-[100px] flex flex-col items-center">
          {(match.status === 'live' || match.status === 'Live' || 
            match.status === 'finished' || match.status === 'Finished' || 
            match.status === 'ended' || match.status === 'completed') && 
           ((match.homeScore !== undefined && match.awayScore !== undefined) || 
            (match.score1 !== undefined && match.score2 !== undefined)) ? (
            <>
              <div className={`text-2xl font-bold text-gray-800 dark:text-gray-100 transition-all duration-300 ${isAnimating ? 'scale-125 text-yellow-500' : 'scale-100'}`}>
                {displayHomeScore} - {displayAwayScore}
              </div>
              {match.quarter && (
                <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {match.quarter}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm">VS</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3 justify-end flex-1 min-w-0">
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate text-right">
            {match.awayTeam || match.team2 || 'Away Team'}
          </span>
          {getTeamIcon(match.awayTeam || match.team2, match.team2Color)}
        </div>
      </div>
      
      {/* Additional info */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {match.venue || 'Venue TBA'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {match.time || formatDate(match.match_date)}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;