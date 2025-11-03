'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLoggerAuth } from '@/contexts/LoggerAuthContext';
import LoggerMatchTracker from '../../../../src/components/logger/basketball/LoggerMatchTracker';
import { Match } from '@/types/matchTracker';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function LoggerMatchPage() {
  const params = useParams();
  const { user, isAuthenticated } = useLoggerAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchMatch(params.id as string);
    }
  }, [params.id]);

  const fetchMatch = async (matchId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, you would fetch the match details from your API
      // For now, we'll simulate a match object
      const mockMatch: Match = {
        id: matchId,
        name: 'Team A vs Team B',
        competitionId: '1',
        homeTeam: {
          id: '1',
          name: 'Team A',
          players: [],
        },
        awayTeam: {
          id: '2',
          name: 'Team B',
          players: [],
        },
        date: new Date().toISOString(),
        location: 'Main Court',
        status: 'scheduled',
        events: [],
        sportType: 'basketball',
        startTime: new Date().toISOString(),
        venue: 'Main Court',
        homeScore: 0,
        awayScore: 0
      };
      
      setMatch(mockMatch);
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  // Security check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be logged in with logger permissions to access this page.
          </p>
          <Button onClick={() => window.location.href = '/logger/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Loading match details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <Button onClick={() => fetchMatch(params.id as string)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Match Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The requested match could not be found.
          </p>
          <Button onClick={() => window.location.href = '/logger'}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/logger'}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Match Logging: {match.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Logger: {user?.name || 'Unknown Logger'}
          </p>
        </div>
        
        <LoggerMatchTracker match={match} />
      </div>
    </div>
  );
}