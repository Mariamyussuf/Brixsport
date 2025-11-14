import React, { useEffect, useState } from 'react';
import { ArrowLeft, Star, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/config/api';
import SmartImage from '@/components/shared/SmartImage';

interface Team {
  id: string;
  name: string;
  logo?: string;
}

interface MatchInfo {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  time: string;
  status: string;
  competition: string;
  date: string;
  venue: string;
  homeFlagColors: { top: string; bottom: string };
  awayFlagColors: { top: string; bottom: string };
}

interface IntelligentMatchHeaderProps {
  match: MatchInfo;
  isFavorited: boolean;
  isScrolled: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}

const TeamBadge: React.FC<{ team: Team; flagColors: { top: string; bottom: string } }> = ({ team, flagColors }) => (
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      {team.logo ? (
        <SmartImage src={team.logo} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className={`${flagColors.top} h-1/2 w-full`}></div>
          <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
        </div>
      )}
    </div>
    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mt-2 truncate max-w-[120px]">{team.name}</span>
  </div>
);

const IntelligentMatchHeader: React.FC<IntelligentMatchHeaderProps> = ({
  match,
  isFavorited,
  isScrolled,
  onBack,
  onToggleFavorite
}) => {
  const router = useRouter();
  const [liveMatch, setLiveMatch] = useState(match);

  // Real-time updates using WebSocket
  useEffect(() => {
    if (!match.id || match.status !== 'live') return;

    // Connect to WebSocket server
    const socket = io(SOCKET_URL);
    
    // Join match room
    socket.emit('joinMatch', { matchId: match.id });
    
    // Listen for score updates
    socket.on('match:scoreUpdate', (update: any) => {
      setLiveMatch(prev => ({
        ...prev,
        homeScore: update.homeScore,
        awayScore: update.awayScore,
        time: update.currentMinute ? `${update.currentMinute}'` : prev.time
      }));
    });
    
    // Listen for status updates
    socket.on('match:statusUpdate', (update: any) => {
      setLiveMatch(prev => ({
        ...prev,
        status: update.status,
        time: update.status === 'completed' ? 'FT' : prev.time
      }));
    });
    
    // Cleanup function
    return () => {
      socket.emit('leaveMatch', { matchId: match.id });
      socket.disconnect();
    };
  }, [match.id, match.status]);

  return (
    <div className={`bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 w-full px-3 sm:px-6 transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'py-2 sticky top-0 z-50 shadow-md' 
        : 'py-4'
    }`}>
      {/* Top Bar - Always visible */}
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-slate-900 dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white">BrixSports</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={onToggleFavorite}>
            <Star
              className={`w-6 h-6 ${
                isFavorited
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            />
          </button>
          <Bell className="w-6 h-6 text-slate-900 dark:text-white" />
        </div>
      </div>

      {/* Match Info - Collapses when scrolled */}
      <div className={`bg-white dark:bg-slate-800 rounded-none sm:rounded-lg w-full border-gray-200 dark:border-white/10 transition-all duration-300 ease-in-out overflow-hidden ${
        isScrolled ? 'header-collapse' : 'header-expand py-4 border-b border-gray-200 dark:border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <TeamBadge team={liveMatch.homeTeam} flagColors={liveMatch.homeFlagColors} />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {liveMatch.homeScore !== undefined && liveMatch.awayScore !== undefined 
                ? `${liveMatch.homeScore} - ${liveMatch.awayScore}` 
                : 'vs'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{liveMatch.time}</div>
          </div>
          <TeamBadge team={liveMatch.awayTeam} flagColors={liveMatch.awayFlagColors} />
        </div>
        
        <div className="text-center mt-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">{liveMatch.competition}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{liveMatch.date} • {liveMatch.venue}</div>
        </div>
      </div>

      {/* Mini Header - Visible when scrolled */}
      <div className={`flex items-center justify-between transition-all duration-300 ease-in-out ${
        isScrolled ? 'mini-header-show' : 'mini-header-hide'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {liveMatch.homeTeam.logo ? (
                <SmartImage src={liveMatch.homeTeam.logo} alt={liveMatch.homeTeam.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className={`${liveMatch.homeFlagColors.top} h-1/2 w-full`}></div>
                  <div className={`${liveMatch.homeFlagColors.bottom} h-1/2 w-full`}></div>
                </div>
              )}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]">{liveMatch.homeTeam.name}</span>
          </div>
          
          <div className="text-center mx-2">
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {liveMatch.homeScore !== undefined && liveMatch.awayScore !== undefined 
                ? `${liveMatch.homeScore} - ${liveMatch.awayScore}` 
                : 'vs'}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]">{liveMatch.awayTeam.name}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {liveMatch.awayTeam.logo ? (
                <SmartImage src={liveMatch.awayTeam.logo} alt={liveMatch.awayTeam.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className={`${liveMatch.awayFlagColors.top} h-1/2 w-full`}></div>
                  <div className={`${liveMatch.awayFlagColors.bottom} h-1/2 w-full`}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {liveMatch.time}
        </div>
      </div>
    </div>
  );
};

export default IntelligentMatchHeader;