import React, { useEffect, useState } from 'react';
import { Activity, Target, CornerDownLeft, AlertTriangle } from 'lucide-react';
import { Match, getMatchById } from '@/lib/userMatchService';
import { TeamStats } from '@/types/matchEvents';

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

const StatsScreen: React.FC<{
  matchId: string;
  homeTeam?: string;
  awayTeam?: string;
}> = ({ 
  matchId,
  homeTeam = "Home Team",
  awayTeam = "Away Team"
}) => {
  const [stats, setStats] = useState<{
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    corners: [number, number];
    fouls: [number, number];
    passes: [number, number];
    passAccuracy: [number, number];
    offsides: [number, number];
    throwIns: [number, number];
    yellowCards: [number, number];
    redCards: [number, number];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!matchId) {
        setError('No match ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch match data from userMatchService
        const match = await getMatchById(matchId);
        
        if (!match) {
          throw new Error('Failed to fetch match data');
        }
        
        // For now, we'll use mock stats since there's no specific stats endpoint
        // In a real implementation, you would fetch actual stats from an endpoint
        setStats({
          possession: [45, 55],
          shots: [8, 12],
          shotsOnTarget: [3, 7],
          corners: [5, 6],
          fouls: [12, 8],
          passes: [320, 410],
          passAccuracy: [78, 85],
          offsides: [2, 3],
          throwIns: [12, 15],
          yellowCards: [2, 1],
          redCards: [0, 1]
        });
      } catch (err: any) {
        console.error('Error fetching match stats:', err);
        setError(err.message || 'Failed to load match statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [matchId]);

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center">
        <div className="text-red-500 dark:text-red-400">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Statistics</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No statistics available for this match</p>
      </div>
    );
  }

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
            label="Possession" 
            values={stats.possession} 
            showPercentage={true}
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 dark:bg-blue-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Shots" 
            values={stats.shots} 
            icon={<Target size={14} className="sm:size-16 text-slate-600 dark:text-slate-300" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Shots on Target" 
            values={stats.shotsOnTarget} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 dark:bg-green-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Corners" 
            values={stats.corners} 
            icon={<CornerDownLeft size={14} className="sm:size-16 text-slate-600 dark:text-slate-300" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Fouls" 
            values={stats.fouls} 
            icon={<AlertTriangle size={14} className="sm:size-16 text-orange-500 dark:text-orange-400" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Total Passes" 
            values={stats.passes} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 dark:bg-purple-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Pass Accuracy" 
            values={stats.passAccuracy} 
            showPercentage={true}
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-indigo-500 dark:bg-indigo-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Offsides" 
            values={stats.offsides} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-teal-500 dark:bg-teal-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Throw Ins" 
            values={stats.throwIns} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-cyan-500 dark:bg-cyan-400 rounded-full" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Yellow Cards" 
            values={stats.yellowCards} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 dark:bg-yellow-400 rounded-sm" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
          <StatRow 
            label="Red Cards" 
            values={stats.redCards} 
            icon={<div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 dark:bg-red-500 rounded-sm" />}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;