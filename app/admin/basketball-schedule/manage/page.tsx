'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBasketballSchedule } from '@/hooks/useBasketballSchedule';

const BasketballScheduleManagementPage = () => {
  const router = useRouter();
  const { schedule, loading, error, refreshSchedule } = useBasketballSchedule();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

  // Flatten the schedule to get all matches
  const allMatches = schedule.flatMap(round => 
    round.matches.map(match => ({
      ...match,
      round: round.round,
      date: round.date
    }))
  );

  const handleUpdateMatch = async (matchId: string, updates: any) => {
    setUpdating(true);
    setUpdateResult(null);
    
    try {
      const response = await fetch('/api/basketball-schedule/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, updates }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUpdateResult({
          success: true,
          message: data.message
        });
        refreshSchedule(); // Refresh the schedule to show updated data
      } else {
        setUpdateResult({
          success: false,
          message: data.error || 'Failed to update match'
        });
      }
    } catch (error: any) {
      setUpdateResult({
        success: false,
        message: 'Network error occurred'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelMatch = async (matchId: string) => {
    setUpdating(true);
    setUpdateResult(null);
    
    try {
      const response = await fetch('/api/basketball-schedule/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, status: 'cancelled' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUpdateResult({
          success: true,
          message: data.message
        });
        refreshSchedule(); // Refresh the schedule to show updated data
      } else {
        setUpdateResult({
          success: false,
          message: data.error || 'Failed to cancel match'
        });
      }
    } catch (error: any) {
      setUpdateResult({
        success: false,
        message: 'Network error occurred'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Schedule</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={refreshSchedule}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Basketball Schedule Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Update match dates, times, venues, or cancel matches
                </p>
              </div>
              <button
                onClick={refreshSchedule}
                className="mt-4 md:mt-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {updateResult && (
              <div className={`rounded-lg p-4 mb-6 ${updateResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <p className={`${updateResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {updateResult.message}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      All Matches
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                    {allMatches.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No matches found</p>
                      </div>
                    ) : (
                      allMatches.map((match) => (
                        <div 
                          key={match.id} 
                          className={`p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                            selectedMatch?.id === match.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {match.home_team_name} vs {match.away_team_name}
                              </div>
                              <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className="mr-3">Round {match.round}</span>
                                <span className="mr-3">{new Date(match.scheduled_at).toLocaleDateString()}</span>
                                <span className="mr-3">{new Date(match.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{match.venue}</span>
                              </div>
                            </div>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                match.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                  : match.status === 'live' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                                    : match.status === 'cancelled' 
                                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                              }`}>
                                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                {selectedMatch ? (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Update Match
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {selectedMatch.home_team_name} vs {selectedMatch.away_team_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Round {selectedMatch.round} • {new Date(selectedMatch.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            defaultValue={new Date(selectedMatch.scheduled_at).toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                            id="match-date"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            defaultValue={new Date(selectedMatch.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                            id="match-time"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Venue
                          </label>
                          <input
                            type="text"
                            defaultValue={selectedMatch.venue}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                            id="match-venue"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                          </label>
                          <select
                            defaultValue={selectedMatch.status}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                            id="match-status"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            onClick={() => {
                              const dateInput = document.getElementById('match-date') as HTMLInputElement;
                              const timeInput = document.getElementById('match-time') as HTMLInputElement;
                              const venueInput = document.getElementById('match-venue') as HTMLInputElement;
                              const statusInput = document.getElementById('match-status') as HTMLSelectElement;
                              
                              // Combine date and time
                              const dateTime = new Date(`${dateInput.value}T${timeInput.value}:00`);
                              
                              const updates = {
                                scheduled_at: dateTime.toISOString(),
                                venue: venueInput.value,
                                status: statusInput.value
                              };
                              
                              handleUpdateMatch(selectedMatch.id, updates);
                            }}
                            disabled={updating}
                            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                              updating
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {updating ? 'Updating...' : 'Update Match'}
                          </button>
                          
                          <button
                            onClick={() => handleCancelMatch(selectedMatch.id)}
                            disabled={updating}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                              updating
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            Cancel Match
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      Select a Match
                    </h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      Choose a match from the list to update its details or cancel it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballScheduleManagementPage;