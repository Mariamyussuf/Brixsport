import React from 'react';
import { Star } from 'lucide-react';
import SmartImage from '../shared/SmartImage';

interface PlayerStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
}

interface TopScorer {
  id: number;
  name: string;
  teamName: string;
  goals: number;
  isHighlighted?: boolean;
}

interface PlayerProfileProps {
  playerNumber: number;
  playerName: string;
  position: string;
  playerImage: string;
  stats: PlayerStats;
  topScorers: TopScorer[];
}

import UserProfile from '../shared/UserProfile';

const PlayerProfile: React.FC<PlayerProfileProps> = ({
  playerNumber = 8,
  playerName = "YANKO",
  position = "midfielder",
  playerImage = "", // Initially empty, can be updated
  stats = {
    gamesPlayed: 12,
    goals: 6,
    assists: 2,
    cleanSheets: 2,
    yellowCards: 1
  },
  topScorers = [
    { id: 1, name: "Player Name", teamName: "Team name", goals: 7 },
    { id: 2, name: "Player Name", teamName: "Team name", goals: 6, isHighlighted: true },
    { id: 3, name: "Player Name", teamName: "Team name", goals: 3 },
    { id: 4, name: "Player Name", teamName: "Team name", goals: 3 },
    { id: 5, name: "Player Name", teamName: "Team name", goals: 2 }
  ]
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-900 to-blue-700 h-16 sm:h-20 md:h-24 lg:h-32 flex items-center justify-between px-3 sm:px-4 lg:px-8">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}>
        </div>
        <Star className="text-white w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 z-10 cursor-pointer hover:opacity-80 transition-opacity active:scale-95" />
      </div>

      {/* Player Header */}
      <div className="bg-white dark:bg-gray-800 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold text-gray-800 dark:text-gray-200">
              {playerNumber}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white truncate">{playerName}</h1>
              <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-gray-500 dark:text-gray-400 capitalize">{position}</p>
            </div>
          </div>
          <UserProfile playerImage={playerImage} playerName={playerName} />
        </div>
      </div>

      {/* Desktop Layout - Two Columns */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:px-8">
        {/* Player Image */}
        <div className="px-3 sm:px-4 lg:px-0 py-4 sm:py-6">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden">
            <SmartImage 
              src={playerImage} 
              alt={`${playerName} playing football`}
              className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>

        {/* Desktop Right Column - Stats and Top Scorers */}
        <div className="lg:py-6 lg:space-y-8">
          {/* Player Information */}
          <div className="px-3 sm:px-4 lg:px-0 pb-4 sm:pb-6 lg:pb-0">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Player information</h2>
              
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 last:border-b-0">
                  <span className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Games played</span>
                  <span className="text-gray-900 font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{stats.gamesPlayed}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 last:border-b-0">
                  <span className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Goals</span>
                  <span className="text-gray-900 font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{stats.goals}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 last:border-b-0">
                  <span className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Assists</span>
                  <span className="text-gray-900 font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{stats.assists}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 lg:py-3 border-b border-gray-50 last:border-b-0">
                  <span className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Clean sheets</span>
                  <span className="text-gray-900 font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{stats.cleanSheets}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 lg:py-3">
                  <span className="text-gray-700 font-medium text-sm sm:text-base lg:text-lg xl:text-xl">Yellow cards</span>
                  <span className="text-gray-900 font-semibold text-base sm:text-lg lg:text-xl xl:text-2xl">{stats.yellowCards}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Scorers */}
          <div className="px-3 sm:px-4 lg:px-0 pb-6 sm:pb-8 lg:pb-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">Top scorers</h2>
            
            <div className="space-y-2 lg:space-y-3">
              {topScorers.map((scorer, index) => (
                <div 
                  key={scorer.id}
                  className={`flex items-center justify-between p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl transition-all duration-200 ${
                    scorer.isHighlighted 
                      ? 'bg-blue-100 border border-blue-200' 
                      : 'bg-white shadow-sm hover:shadow-lg active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 min-w-0 flex-1">
                    <span className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold w-4 sm:w-6 lg:w-8 flex-shrink-0 ${
                      scorer.isHighlighted ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-3 sm:w-6 sm:h-4 lg:w-8 lg:h-6 bg-blue-600 rounded-sm"></div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium text-sm sm:text-base lg:text-lg xl:text-xl truncate ${
                        scorer.isHighlighted ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {scorer.name}
                      </div>
                      <div className={`text-xs sm:text-sm lg:text-base xl:text-lg truncate ${
                        scorer.isHighlighted ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {scorer.teamName}
                      </div>
                    </div>
                  </div>
                  
                  <span className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold flex-shrink-0 ml-2 ${
                    scorer.isHighlighted ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {scorer.goals}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;