import React, { useState, useEffect } from 'react';
import piratesFC from '@/assets/football/pirates-fc.jpg';
import kingsFC from '@/assets/football/kings-fc.jpg';
import wolvesFC from '@/assets/football/wolves-fc.png';
import agendaFC from '@/assets/football/agenda-fc.jpg';
import allianzFC from '@/assets/football/allianz-fc.jpg';
import blazeFC from '@/assets/football/blaze-fc.jpg';
import cruiseFC from '@/assets/football/cruise-fc.jpg';
import hammersFC from '@/assets/football/hammers-fc.jpg';
import jogaBonitoFC from '@/assets/football/joga bonito-fc.jpg';
import laFabrica from '@/assets/football/la-fabrica.jpg';
import legacyFC from '@/assets/football/legacy-fc.jpg';
import primeFC from '@/assets/football/prime-fc.jpg';
import quantumFC from '@/assets/football/quantum-fc.jpg';
import santosFC from '@/assets/football/santos-fc.jpg';
import underratedFC from '@/assets/football/underrated-fc.jpg';
import westbridgeFC from '@/assets/Westbridge-fc.jpg';
import vikings from '@/assets/vikings.jpg';
import titans from '@/assets/titans.jpg';
import theStorm from '@/assets/the storm.jpg';
import tbk from '@/assets/tbk.jpg';
import siberia from '@/assets/siberia.jpg';
import rimReapears from '@/assets/rim-reapers.jpg';
import { useRouter } from 'next/navigation';
import { useI18n } from './I18nProvider';
import { io } from 'socket.io-client';

export interface Match {
  id: string;
  // HomeScreen properties
  team1?: string;
  team2?: string;
  score1?: number;
  score2?: number;
  team1Color?: string;
  team2Color?: string;
  team1Logo?: string;
  team2Logo?: string;
  sportType?: string;
  // FixturesScreen properties
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
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
  const [liveMatch, setLiveMatch] = useState(match);

  // Handle score animations
  useEffect(() => {
    const newHomeScore = liveMatch.homeScore ?? liveMatch.score1 ?? 0;
    const newAwayScore = liveMatch.awayScore ?? liveMatch.score2 ?? 0;

    if (newHomeScore !== displayHomeScore || newAwayScore !== displayAwayScore) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayHomeScore(newHomeScore);
        setDisplayAwayScore(newAwayScore);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [liveMatch.homeScore, liveMatch.score1, liveMatch.awayScore, liveMatch.score2, displayHomeScore, displayAwayScore]);

  // Real-time updates using WebSocket
  useEffect(() => {
    if (!match.id || match.status !== 'live') return;

    // Connect to WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    
    // Join match room
    socket.emit('joinMatch', { matchId: match.id });
    
    // Listen for score updates
    socket.on('match:scoreUpdate', (update: any) => {
      setLiveMatch(prev => ({
        ...prev,
        homeScore: update.homeScore,
        awayScore: update.awayScore,
        current_minute: update.currentMinute,
        period: update.period
      }));
    });
    
    // Listen for status updates
    socket.on('match:statusUpdate', (update: any) => {
      setLiveMatch(prev => ({
        ...prev,
        status: update.status
      }));
    });
    
    // Cleanup function
    return () => {
      socket.emit('leaveMatch', { matchId: match.id });
      socket.disconnect();
    };
  }, [match.id, match.status]);

  const getTeamIcon = (team: string | undefined, color?: string, logoUrl?: string) => {
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
        {logoUrl || resolveAssetLogo(team) ? (
          <img
            src={logoUrl || resolveAssetLogo(team)}
            alt={team}
            className="w-5 h-5 rounded-sm object-contain"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              const fallback = resolveAssetLogo(team);
              if (fallback && target.src !== fallback) {
                target.src = fallback;
              } else {
                target.style.display = 'none';
              }
            }}
          />
        ) : (
          <div className="w-5 h-5 rounded-sm"></div>
        )}
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
        if (liveMatch.id) {
          router.push(`/match/${liveMatch.id}`);
        } else {
          router.push(`/match/1`);
        }
      }}
    >
      {/* Header with status and sport info */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <span className={`${getStatusColor(liveMatch.status)} text-white px-2 py-1 rounded-full text-xs font-medium ${liveMatch.status.toLowerCase() === 'live' ? 'animate-pulse' : ''}`}>
            {t(liveMatch.status.toLowerCase()) || liveMatch.status}
          </span>
          {liveMatch.sport && (
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
              {liveMatch.sport.charAt(0).toUpperCase() + liveMatch.sport.slice(1)}
            </span>
          )}
        </div>
        {liveMatch.match_date && (
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {formatDate(liveMatch.match_date)}
          </span>
        )}
      </div>
      
      {/* Teams and scores */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {getTeamIcon(
            liveMatch.homeTeam || liveMatch.team1,
            liveMatch.team1Color,
            (liveMatch.homeTeamLogo || liveMatch.team1Logo)
          )}
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">
            {liveMatch.homeTeam || liveMatch.team1 || 'Home Team'}
          </span>
        </div>
        
        <div className="px-4 min-w-[100px] flex flex-col items-center">
          {(liveMatch.status === 'live' || liveMatch.status === 'Live' || 
            liveMatch.status === 'finished' || liveMatch.status === 'Finished' || 
            liveMatch.status === 'ended' || liveMatch.status === 'completed') && 
           ((liveMatch.homeScore !== undefined && liveMatch.awayScore !== undefined) || 
            (liveMatch.score1 !== undefined && liveMatch.score2 !== undefined)) ? (
            <>
              <div className={`text-2xl font-bold text-gray-800 dark:text-gray-100 transition-all duration-300 ${isAnimating ? 'scale-125 text-yellow-500' : 'scale-100'}`}>
                {displayHomeScore} - {displayAwayScore}
              </div>
              {liveMatch.quarter && (
                <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {liveMatch.quarter}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm">VS</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3 justify-end flex-1 min-w-0">
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate text-right">
            {liveMatch.awayTeam || liveMatch.team2 || 'Away Team'}
          </span>
          {getTeamIcon(
            liveMatch.awayTeam || liveMatch.team2,
            liveMatch.team2Color,
            (liveMatch.awayTeamLogo || liveMatch.team2Logo)
          )}
        </div>
      </div>
      
      {/* Additional info */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {liveMatch.venue || 'Venue TBA'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {liveMatch.time || formatDate(liveMatch.match_date)}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
  const normalizeName = (name?: string) => (name || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/fc$/i, ' fc')
    .replace(/\s+/g, ' ')
    .trim();

  const TEAM_ASSET_LOGOS: Record<string, any> = {
    'pirates fc': piratesFC,
    'kings fc': kingsFC,
    'wolves fc': wolvesFC,
    'agenda fc': agendaFC,
    'allianz fc': allianzFC,
    'blaze fc': blazeFC,
    'cruise fc': cruiseFC,
    'hammers fc': hammersFC,
    'joga bonito fc': jogaBonitoFC,
    'la fabrica': laFabrica,
    'legacy fc': legacyFC,
    'prime fc': primeFC,
    'quantum fc': quantumFC,
    'santos fc': santosFC,
    'underrated fc': underratedFC,
    'westbridge fc': westbridgeFC,
    'vikings': vikings,
    'titans': titans,
    'the storm': theStorm,
    'tbk': tbk,
    'siberia': siberia,
    'rim reapears': rimReapears
  };

  const resolveAssetLogo = (teamName?: string): string | undefined => {
    const key = normalizeName(teamName);
    const asset = TEAM_ASSET_LOGOS[key];
    return asset ? (asset.src || asset) : undefined;
  };