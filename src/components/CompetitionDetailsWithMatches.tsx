"use client";

import React, { useState } from 'react';
import { ArrowLeft, Calendar, Users, Trophy, RefreshCw, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCompetitionDetails } from '@/hooks/useCompetitionDetails';
import { Match } from '@/lib/competitionService';

interface CompetitionDetailsWithMatchesProps {
  competitionId: number;
}

const CompetitionDetailsWithMatches: React.FC<CompetitionDetailsWithMatchesProps> = ({ competitionId }) => {
  const router = useRouter();
  const { competitionData, loading, error, refreshCompetition } = useCompetitionDetails(competitionId);
  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'standings' | 'teams'>('overview');

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString();
  };

  // Format match time
  const formatMatchTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading competition details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Competition</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshCompetition}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!competitionData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Competition Not Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The competition you're looking for doesn't exist or has been removed.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go Back
            </button>
            <button
              onClick={refreshCompetition}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { competition, matches } = competitionData;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white">Brixsport</h1>
          </div>
        </div>
        <button
          onClick={refreshCompetition}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-slate-900 dark:text-white" />
        </button>
      </header>

      {/* Competition Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{competition.name}</h1>
            <p className="text-blue-100 mt-1">{competition.category}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(competition.status)}`}>
            {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Competition Info Cards */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
              <p className="font-medium">{formatDate(competition.start_date)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
              <p className="font-medium">{formatDate(competition.end_date)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-white/10">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
              <p className="font-medium">{competition.type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="inline-flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 mb-4">
          {([
            { key: 'overview' as const, label: 'Overview' },
            { key: 'fixtures' as const, label: 'Fixtures' },
            { key: 'standings' as const, label: 'Standings' },
            { key: 'teams' as const, label: 'Teams' }
          ]).map(({ key, label }) => (
            <button
              key={key}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'bg-gray-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
              } ${key !== 'overview' ? 'border-l border-gray-200 dark:border-white/10' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">About this competition</h2>
            <p className="text-gray-700 dark:text-gray-300">
              This is the {competition.name}, a {competition.category} {competition.type} competition. 
              The competition started on {formatDate(competition.start_date)} and will end on {formatDate(competition.end_date)}.
            </p>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Competition Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium">{competition.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium">{competition.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium capitalize">{competition.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="font-medium">
                    {formatDate(competition.start_date)} - {formatDate(competition.end_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'fixtures' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Fixtures</h2>
            {matches.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No fixtures available for this competition.</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match: Match) => (
                  <div key={match.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(match.status)}`}>
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatMatchTime(match.match_date)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                        <div>
                          <p className="font-medium">{match.home_team_name}</p>
                          {match.status === 'live' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Home</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        {match.status === 'scheduled' ? (
                          <span className="text-gray-500 dark:text-gray-400">vs</span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold">{match.home_score}</span>
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                            <span className="text-xl font-bold">{match.away_score}</span>
                          </div>
                        )}
                        {match.status === 'live' && (
                          <div className="flex items-center justify-center mt-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                            <span className="text-xs text-red-500 font-medium">LIVE</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-right">{match.away_team_name}</p>
                          {match.status === 'live' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">Away</p>
                          )}
                        </div>
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{match.venue || 'Venue TBD'}</span>
                      <Clock className="w-4 h-4 ml-3 mr-1" />
                      <span>{formatMatchTime(match.match_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'standings' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Current Standings</h2>
            <p className="text-gray-500 dark:text-gray-400">Standings information will be available soon.</p>
          </div>
        )}
        
        {activeTab === 'teams' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Participating Teams</h2>
            <p className="text-gray-500 dark:text-gray-400">Team information will be available soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionDetailsWithMatches;