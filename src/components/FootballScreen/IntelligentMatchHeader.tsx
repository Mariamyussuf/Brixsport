import React from 'react';
import { ArrowLeft, Star, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

const TeamFlag: React.FC<{ flagColors: { top: string; bottom: string } }> = ({ flagColors }) => (
  <div className="w-12 h-12 rounded-full overflow-hidden flex flex-col">
    <div className={`${flagColors.top} h-1/2 w-full`}></div>
    <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
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

  return (
    <div className={`bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 w-full px-0 sm:px-6 transition-all duration-300 ease-in-out ${
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
          <div className="flex flex-col items-center">
            <TeamFlag flagColors={match.homeFlagColors} />
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">{match.homeTeam.name}</span>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {match.homeScore !== undefined && match.awayScore !== undefined 
                ? `${match.homeScore} - ${match.awayScore}` 
                : 'vs'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{match.time}</div>
          </div>

          <div className="flex flex-col items-center">
            <TeamFlag flagColors={match.awayFlagColors} />
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">{match.awayTeam.name}</span>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">{match.competition}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{match.date} • {match.venue}</div>
        </div>
      </div>

      {/* Mini Header - Visible when scrolled */}
      <div className={`flex items-center justify-between transition-all duration-300 ease-in-out ${
        isScrolled ? 'mini-header-show' : 'mini-header-hide'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <TeamFlag flagColors={match.homeFlagColors} />
            <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px]">{match.homeTeam.name}</span>
          </div>
          
          <div className="text-center mx-2">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {match.homeScore !== undefined && match.awayScore !== undefined 
                ? `${match.homeScore} - ${match.awayScore}` 
                : 'vs'}
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px]">{match.awayTeam.name}</span>
            <TeamFlag flagColors={match.awayFlagColors} />
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {match.time}
        </div>
      </div>
    </div>
  );
};

export default IntelligentMatchHeader;