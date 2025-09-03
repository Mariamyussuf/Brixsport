import React from 'react';
import { Activity, Target, CornerDownLeft, AlertTriangle } from 'lucide-react';

interface StatRowProps {
  label: string;
  values: [number, number];
  showPercentage?: boolean;
  icon?: React.ReactNode;
  homeTeam?: string;
  awayTeam?: string;
}

// Enhanced Statistics Row Component - Fully Responsive
const StatRow: React.FC<StatRowProps> = ({ 
  label, 
  values, 
  showPercentage = false, 
  icon, 
  homeTeam = "Home Team", 
  awayTeam = "Away Team" 
}) => {
  const [homeValue, awayValue] = values;
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
  
  return (
    <div className="group hover:bg-slate-50 dark:hover:bg-gray-700 p-2 sm:p-4 rounded-lg transition-colors">
      {/* Team names - Responsive visibility */}
      <div className="hidden sm:flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
        <span className="truncate max-w-24 lg:max-w-none">{homeTeam}</span>
        <span className="truncate max-w-24 lg:max-w-none">{awayTeam}</span>
      </div>
      
      {/* Values and label - Fully responsive */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-blue-600 dark:text-blue-400">
          {showPercentage ? `${homeValue}%` : homeValue}
        </span>
        <div className="flex items-center space-x-1 sm:space-x-2 text-slate-600 dark:text-slate-300 px-2">
          {icon}
          <span className="font-medium text-xs sm:text-sm md:text-base text-center">
            {label}
          </span>
        </div>
        <span className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-red-600 dark:text-red-400">
          {showPercentage ? `${awayValue}%` : awayValue}
        </span>
      </div>
      
      {/* Progress bar - Fully responsive */}
      <div className="h-2 sm:h-3 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden flex shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 transition-all duration-700 ease-out"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
      
      {/* Percentage labels - Fully responsive */}
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
        <span>{homePercent.toFixed(0)}%</span>
        <span>{awayPercent.toFixed(0)}%</span>
      </div>
    </div>
  );
};

const BasketballStatsScreen: React.FC<{
  homeTeam?: string;
  awayTeam?: string;
}> = ({ 
  homeTeam = "Phoenix",
  awayTeam = "Blazers"
}) => {
  // Sample basketball stats data
  const stats = {
    fieldGoals: [28, 35] as [number, number],
    threePointers: [8, 12] as [number, number],
    freeThrows: [12, 14] as [number, number],
    rebounds: [32, 41] as [number, number],
    assists: [18, 22] as [number, number],
    steals: [7, 9] as [number, number],
    blocks: [3, 5] as [number, number],
    turnovers: [11, 8] as [number, number],
    fouls: [18, 15] as [number, number]
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-3 sm:p-4 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-700 rounded-t-lg">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center text-sm sm:text-base">
            <Activity size={16} className="sm:size-18 mr-2 text-blue-600 dark:text-blue-400" />
            Match Statistics
          </h3>
        </div>
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-8">
          <StatRow 
            label="Field Goals" 
            values={stats.fieldGoals} 
            icon={<Target size={14} className="sm:size-16 text-slate-600 dark:text-slate-300" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="3-Pointers" 
            values={stats.threePointers} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 dark:bg-orange-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Free Throws" 
            values={stats.freeThrows} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 dark:bg-green-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Rebounds" 
            values={stats.rebounds} 
            icon={<CornerDownLeft size={14} className="sm:size-16 text-slate-600 dark:text-slate-300" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Assists" 
            values={stats.assists} 
            icon={<AlertTriangle size={14} className="sm:size-16 text-blue-500 dark:text-blue-400" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Steals" 
            values={stats.steals} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 dark:bg-purple-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Blocks" 
            values={stats.blocks} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Turnovers" 
            values={stats.turnovers} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 dark:bg-red-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Fouls" 
            values={stats.fouls} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 dark:bg-yellow-400 rounded-sm" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </div>
      </div>
    </div>
  );
};

export default BasketballStatsScreen;