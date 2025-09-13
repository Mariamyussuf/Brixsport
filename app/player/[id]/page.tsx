'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import PlayerProfile from '@/components/FootballScreen/PlayerProfileScreen';

interface PlayerData {
  id: number;
  number: number;
  name: string;
  position: string;
  team: string;
  image: string;
  stats: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
  };
}

const PlayerProfileScreen = () => {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [topScorers, setTopScorers] = useState<Array<{ id: number; name: string; teamName: string; goals: number; }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const playerId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch player data
        const playerResponse = await fetch(`/api/players/${playerId}`);
        const playerData = await playerResponse.json();
        
        if (!playerResponse.ok) {
          throw new Error(playerData.error || 'Failed to fetch player');
        }

        setPlayer(playerData.data);
        
        // Fetch top scorers data
        const scorersResponse = await fetch(`/api/teams/top-scorers`);
        const scorersData = await scorersResponse.json();
        
        if (scorersResponse.ok) {
          setTopScorers(scorersData.data || []);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setPlayer(null);
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchData();
    }
  }, [playerId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    // Check if this is a "feature not implemented" case
    const isComingSoon = error?.includes('feature_not_implemented');

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center px-4 max-w-md mx-auto">
          <div className="mb-8">
            {isComingSoon ? (
              // Rocket icon for "Coming Soon"
              <svg 
                className="w-20 h-20 mx-auto text-blue-500 dark:text-blue-400 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            ) : (
              // Info icon for "Not Available"
              <svg 
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              {isComingSoon ? 'Coming Soon!' : 'Data Not Available'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {isComingSoon ? (
                <>
                  We're working hard to bring you player profiles! This feature will be available in the next update.
                  <br/><br/>
                  <span className="text-blue-600 dark:text-blue-400">Stay tuned for exciting new features!</span>
                </>
              ) : (
                "This player's information is not available yet. Please check back later."
              )}
            </p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
            >
              Go Back
            </button>
            {isComingSoon && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Expected Release: Q4 2025
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header with Back Button */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white ml-2">Player Profile</h1>
        </div>
      </div>
      
      {/* Player Profile Content with top padding to account for fixed header */}
      <div className="pt-16">
        <PlayerProfile
          playerId={playerId}
        />
      </div>
    </div>
  );
};

export default PlayerProfileScreen;