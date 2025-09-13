'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Bell } from 'lucide-react';
import FootballFormation from '@/components/FootballScreen/Formationscreen';
import StatsScreen from '@/components/FootballScreen/StatsScreen';
import MatchLineupTab from '@/components/FootballScreen/MatchLineupTab';
import SummaryScreen from '@/components/FootballScreen/SummaryScreen';
import BasketballMatchCenter from '@/components/BasketballScreen/BasketballMatchCenter';
import { useAuth } from '@/hooks/useAuth';
import { LoginPrompt } from '@/components/shared/LoginPrompt';
import { getMatchById } from '@/lib/userMatchService';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import IntelligentMatchHeader from '@/components/FootballScreen/IntelligentMatchHeader';

// Remove mock data and fetch real data instead
const MatchDetailsScreen = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'lineup' | 'formation' | 'stats'>('summary');
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isScrolled } = useScrollDetection({ shrinkThreshold: 50, expandThreshold: 20 });

  const matchId = params.id as string;

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
        
        // Fetch match data from userMatchService
        const matchData = await getMatchById(matchId);
        
        if (!matchData) {
          setError('Match not found');
          return;
        }
        
        setMatch({
          id: matchData.id,
          sportType: 'football', // This would come from the match data
          homeTeam: matchData.homeTeam,
          awayTeam: matchData.awayTeam,
          homeScore: matchData.homeScore || 0,
          awayScore: matchData.awayScore || 0,
          time: matchData.status === 'live' ? "Live" : matchData.date,
          status: matchData.status,
          homeFlagColors: { top: 'bg-blue-600', bottom: 'bg-black' }, // These would come from team data
          awayFlagColors: { top: 'bg-red-600', bottom: 'bg-blue-600' }, // These would come from team data
          competition: 'Competition Name', // This would come from competition data
          date: matchData.date,
          venue: matchData.venue
        });
      } catch (err: any) {
        console.error('Error fetching match data:', err);
        setError(err.message || 'Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Match</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  // Render sport-specific components
  const renderSummaryScreen = () => {
    if (match.sportType === 'basketball') {
      return <BasketballMatchCenter matchId={matchId} />;
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
          <MatchLineupTab matchId={matchId} />
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
            matchId={matchId}
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
        <div className="w-full">
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
        {/* Intelligent Header */}
        <IntelligentMatchHeader
          match={match}
          isFavorited={isFavorited}
          isScrolled={isScrolled}
          onBack={() => router.back()}
          onToggleFavorite={toggleFavorite}
        />

        {/* Tab Content */}
        <div className="w-full">
          {/* Only show tabs for football, basketball uses its own navigation */}
          {match.sportType === 'football' && (
            <div className={`mb-4 px-0 sm:px-1 ${isScrolled ? 'sticky top-16 z-40 bg-gray-50 dark:bg-gray-900' : ''}`}>
              <div className="flex w-full border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
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
              {activeTab === 'summary' && (
                <div className="px-0 sm:px-4 w-full">
                  {renderSummaryScreen()}
                </div>
              )}
              {activeTab === 'lineup' && (
                <div className="px-0 sm:px-4 w-full">
                  {renderLineupTab()}
                </div>
              )}
              {activeTab === 'formation' && renderFormationTab()}
              {activeTab === 'stats' && (
                <div className="px-0 sm:px-4 w-full">
                  {renderStatsScreen()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MatchDetailsScreen;