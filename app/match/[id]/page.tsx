'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Bell } from 'lucide-react';
import FootballFormation from '@/components/FootballScreen/Formationscreen';
import StatsScreen from '@/components/FootballScreen/StatsScreen';
import MatchLineupTab from '@/components/FootballScreen/MatchLineupTab';
import SummaryScreen from '@/components/FootballScreen/SummaryScreen';
import BasketballMatchCenter from '@/components/BasketballScreen/BasketballMatchCenter';
import { useAuth } from '@/hooks/useAuth';
import { LoginPrompt } from '@/components/shared/LoginPrompt';

// Mock data for matches - Updated to be consistent with Homescreen data
const mockMatches: Record<string, any> = {
  'match-1': {
    id: 'match-1',
    sportType: 'football',
    homeTeam: 'Pirates FC',
    awayTeam: 'Joga FC',
    homeScore: 0,
    awayScore: 1,
    time: "71'",
    status: 'live',
    homeFlagColors: { top: 'bg-blue-600', bottom: 'bg-black' },
    awayFlagColors: { top: 'bg-red-600', bottom: 'bg-blue-600' },
    competition: 'Busa League',
    date: 'Today',
    venue: 'Main Stadium'
  },
  'match-2': {
    id: 'match-2',
    sportType: 'football',
    homeTeam: 'Los Blancos',
    awayTeam: 'La Masia',
    time: '2:30',
    status: 'scheduled',
    homeFlagColors: { top: 'bg-white', bottom: 'bg-blue-600' },
    awayFlagColors: { top: 'bg-blue-800', bottom: 'bg-red-600' },
    competition: 'Premier League',
    date: 'Tomorrow',
    venue: 'Camp Nou'
  },
  'match-3': {
    id: 'match-3',
    sportType: 'football',
    homeTeam: 'Spartans',
    awayTeam: 'Kings FC',
    time: '4:00',
    status: 'scheduled',
    homeFlagColors: { top: 'bg-red-600', bottom: 'bg-white' }, 
    awayFlagColors: { top: 'bg-purple-600', bottom: 'bg-yellow-400' },
    competition: 'Champions League',
    date: 'Tomorrow',
    venue: 'Wembley Stadium'
  },
  'match-4': {
    id: 'match-4',
    sportType: 'basketball',
    homeTeam: 'Phoenix',
    awayTeam: 'Blazers',
    homeScore: 18,
    awayScore: 38,
    time: "2nd Quarter",
    status: 'live',
    homeFlagColors: { top: 'bg-orange-600', bottom: 'bg-white' },
    awayFlagColors: { top: 'bg-blue-600', bottom: 'bg-red-600' },
    competition: 'Basketball League',
    date: 'Today',
    venue: 'Main Arena'
  },
  'match-5': {
    id: 'match-5',
    sportType: 'basketball',
    homeTeam: 'Phoenix',
    awayTeam: 'Blazers',
    time: '3:00',
    status: 'scheduled',
    homeFlagColors: { top: 'bg-orange-600', bottom: 'bg-white' },
    awayFlagColors: { top: 'bg-blue-600', bottom: 'bg-red-600' },
    competition: 'Basketball League',
    date: 'Tomorrow',
    venue: 'Main Arena'
  },
  'match-6': {
    id: 'match-6',
    sportType: 'basketball',
    homeTeam: 'Phoenix',
    awayTeam: 'Blazers',
    time: '5:00',
    status: 'scheduled',
    homeFlagColors: { top: 'bg-orange-600', bottom: 'bg-white' },
    awayFlagColors: { top: 'bg-blue-600', bottom: 'bg-red-600' },
    competition: 'Basketball League',
    date: 'Tomorrow',
    venue: 'Main Arena'
  }
};

const MatchDetailsScreen = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'lineup' | 'formation' | 'stats'>('summary');

  const matchId = params.id as string;
  const match = mockMatches[matchId];

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Not Found</h2>
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

  const TeamFlag: React.FC<{ flagColors: { top: string; bottom: string } }> = ({ flagColors }) => (
    <div className="w-12 h-12 rounded-full overflow-hidden flex flex-col">
      <div className={`${flagColors.top} h-1/2 w-full`}></div>
      <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
    </div>
  );

  // Render sport-specific components
  const renderSummaryScreen = () => {
    if (match.sportType === 'basketball') {
      return <BasketballMatchCenter match={match} />;
    }
    
    // Default to football
    return (
      <SummaryScreen 
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeScore={match.homeScore || 0}
        awayScore={match.awayScore || 0}
        matchDate={match.date}
        matchVenue={match.venue}
        events={[
          { time: 21, team: 'home', player: 'Calafiori', eventType: 'yellow' },
          { time: 33, team: 'away', player: 'Sammy', eventType: 'goal', assistBy: 'Yanko', score: '0-1' },
          { time: 21, team: 'away', player: 'McTee', eventType: 'yellow' },
          { time: 59, team: 'home', player: 'Yanko', eventType: 'goal', assistBy: 'Sammy', score: '1-1' },
          { time: 71, team: 'away', player: 'Sammy', eventType: 'goal', score: '1-2' },
          { time: 72, team: 'away', player: 'David', eventType: 'substitution', inPlayer: 'Femi' },
          { time: 72, team: 'home', player: 'Taiwo', eventType: 'substitution', inPlayer: 'Isreal' },
          { time: 72, team: 'home', player: 'Dennis', eventType: 'substitution', inPlayer: 'Idimu' },
          { time: 75, team: 'away', player: 'Aguero', eventType: 'goal', assistBy: 'Yanko', score: '1-3' }
        ]}
      />
    );
  };

  const renderLineupTab = () => {
    // Only football has lineups in the tab structure
    if (match.sportType === 'football') {
      return (
        <div className="w-full">
          <MatchLineupTab />
        </div>
      );
    }
    
    // For basketball, we use the unified view
    return null;
  };

  const renderStatsScreen = () => {
    // Only football has stats in the tab structure
    if (match.sportType === 'football') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-0 w-full">
          <StatsScreen
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />
        </div>
      );
    }
    
    // For basketball, we use the unified view
    return null;
  };

  const renderFormationTab = () => {
    // Only football has formations
    if (match.sportType === 'football') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full">
          <FootballFormation />
        </div>
      );
    }
    
    // For other sports, show a message
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full text-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Formation Not Available</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Formations are only available for football matches.
        </p>
      </div>
    );
  };

  return (
    <>
      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
        {/* Header */}
        <div className="bg-slate-800 dark:bg-slate-900 w-full px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                </div>
                <h1 className="text-xl font-normal text-white">BrixSports</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={toggleFavorite}>
                <Star
                  className={`w-6 h-6 ${
                    isFavorited
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-white'
                  }`}
                />
              </button>
              <Bell className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 w-full">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <TeamFlag flagColors={match.homeFlagColors} />
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">{match.homeTeam}</span>
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
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">{match.awayTeam}</span>
              </div>
            </div>
            
            <div className="text-center mt-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">{match.competition}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{match.date} • {match.venue}</div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 w-full">
          {/* Only show tabs for football, basketball uses its own navigation */}
          {match.sportType === 'football' && (
            <div className="mb-4 px-1">
              <div className="flex w-full border-b border-slate-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`pb-2 px-4 text-base font-medium whitespace-nowrap ${
                    activeTab === 'summary'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('lineup')}
                  className={`pb-2 px-4 text-base font-medium whitespace-nowrap ${
                    activeTab === 'lineup'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Lineup
                </button>
                <button
                  onClick={() => setActiveTab('formation')}
                  className={`pb-2 px-4 text-base font-medium whitespace-nowrap ${
                    activeTab === 'formation'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Formation
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`pb-2 px-4 text-base font-medium whitespace-nowrap ${
                    activeTab === 'stats'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Stats
                </button>
              </div>
            </div>
          )}
          
          {/* For basketball, render the new component directly */}
          {match.sportType === 'basketball' ? (
            renderSummaryScreen()
          ) : (
            <>
              {activeTab === 'summary' && renderSummaryScreen()}
              {activeTab === 'lineup' && renderLineupTab()}
              {activeTab === 'formation' && renderFormationTab()}
              {activeTab === 'stats' && renderStatsScreen()}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MatchDetailsScreen;