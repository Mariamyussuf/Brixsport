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
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      {team.logo ? (
        <SmartImage 
          src={team.logo} 
          alt={team.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to flag colors if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full flex flex-col';
              fallback.innerHTML = `
                <div class="${flagColors.top} h-1/2 w-full"></div>
                <div class="${flagColors.bottom} h-1/2 w-full"></div>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className={`${flagColors.top} h-1/2 w-full`}></div>
          <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
        </div>
      )}
    </div>
    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 text-center max-w-[100px] sm:max-w-[120px] truncate">{team.name}</span>
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

  const formatScheduleLabel = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const isSameDay = date.toDateString() === today.toDateString();
    const timePart = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isSameDay) {
      return `Today at ${timePart}`;
    }
    const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${datePart}, ${timePart}`;
  };

  const isLiveStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'live';
  };

  const isFinishedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'finished' || s === 'completed' || s === 'ended';
  };

  const isScheduledStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'scheduled' || s === 'upcoming';
  };

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
        : 'py-3 sm:py-4'
    }`}>
      {/* Top Bar - Always visible */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button onClick={onBack} className="text-slate-900 dark:text-white p-1">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 sm:w-4 sm:h-4 border border-white rounded-full"></div>
            </div>
            <h1 className="text-lg sm:text-xl font-normal text-slate-900 dark:text-white">BrixSports</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button onClick={onToggleFavorite} className="p-1">
            <Star
              className={`w-5 h-5 sm:w-6 sm:h-6 ${
                isFavorited
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            />
          </button>
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 dark:text-white" />
        </div>
      </div>

      {/* Match Info - Collapses when scrolled */}
      <div className={`bg-white dark:bg-slate-800 rounded-none sm:rounded-lg w-full border-gray-200 dark:border-white/10 transition-all duration-300 ease-in-out overflow-hidden ${
        isScrolled ? 'header-collapse' : 'header-expand py-3 sm:py-4 border-b border-gray-200 dark:border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <TeamBadge team={liveMatch.homeTeam} flagColors={liveMatch.homeFlagColors} />
          <div className="text-center mx-2 sm:mx-4">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {isLiveStatus(liveMatch.status) || isFinishedStatus(liveMatch.status)
                ? (liveMatch.homeScore !== undefined && liveMatch.awayScore !== undefined
                    ? `${liveMatch.homeScore} - ${liveMatch.awayScore}`
                    : 'vs')
                : 'vs'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {isLiveStatus(liveMatch.status) ? (liveMatch.time || 'Live') : formatScheduleLabel(liveMatch.date)}
            </div>
          </div>
          <TeamBadge team={liveMatch.awayTeam} flagColors={liveMatch.awayFlagColors} />
        </div>
        
        <div className="text-center mt-3">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{liveMatch.competition}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{liveMatch.date} • {liveMatch.venue}</div>
        </div>
      </div>

      {/* Mini Header - Visible when scrolled */}
      <div className={`flex items-center justify-between transition-all duration-300 ease-in-out ${
        isScrolled ? 'mini-header-show' : 'mini-header-hide'
      }`}>
        <div className="flex items-center space-x-2 min-w-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {liveMatch.homeTeam.logo ? (
                <SmartImage 
                  src={liveMatch.homeTeam.logo} 
                  alt={liveMatch.homeTeam.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to flag colors if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex flex-col';
                      fallback.innerHTML = `
                        <div class="${liveMatch.homeFlagColors.top} h-1/2 w-full"></div>
                        <div class="${liveMatch.homeFlagColors.bottom} h-1/2 w-full"></div>
                      `;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className={`${liveMatch.homeFlagColors.top} h-1/2 w-full`}></div>
                  <div className={`${liveMatch.homeFlagColors.bottom} h-1/2 w-full`}></div>
                </div>
              )}
            </div>
            <span className="ml-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px] sm:max-w-[100px]">{liveMatch.homeTeam.name}</span>
          </div>
          
          <div className="text-center mx-1 sm:mx-2 flex-shrink-0">
            <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
              {liveMatch.homeScore !== undefined && liveMatch.awayScore !== undefined 
                ? `${liveMatch.homeScore} - ${liveMatch.awayScore}` 
                : 'vs'}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px] sm:max-w-[100px]">{liveMatch.awayTeam.name}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {liveMatch.awayTeam.logo ? (
                <SmartImage 
                  src={liveMatch.awayTeam.logo} 
                  alt={liveMatch.awayTeam.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to flag colors if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex flex-col';
                      fallback.innerHTML = `
                        <div class="${liveMatch.awayFlagColors.top} h-1/2 w-full"></div>
                        <div class="${liveMatch.awayFlagColors.bottom} h-1/2 w-full"></div>
                      `;
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col">
                  <div className={`${liveMatch.awayFlagColors.top} h-1/2 w-full`}></div>
                  <div className={`${liveMatch.awayFlagColors.bottom} h-1/2 w-full`}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">
          {isLiveStatus(liveMatch.status) ? (liveMatch.time || 'Live') : formatScheduleLabel(liveMatch.date)}
        </div>
      </div>
    </div>
  );
};

export default IntelligentMatchHeader;