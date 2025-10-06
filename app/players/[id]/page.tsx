'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Player, CareerStats } from '@/types/brixsports';
import playerService from '@/services/playerService';
import PlayerProfile from '@/components/PlayerProfile';
import { ArrowLeft } from 'lucide-react';

interface PlayerDetailPageProps {
  params: Promise<{ id: string }>;
}

const PlayerDetailPage: React.FC<PlayerDetailPageProps> = ({ params }) => {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<CareerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params;
      if (!id) return;
      
      try {
        // Fetch player data
        const playerResponse = await playerService.getPlayerById(id);
        if (playerResponse.success) {
          setPlayer(playerResponse.data);
        } else {
          setError(playerResponse.error?.message || 'Failed to fetch player');
          return;
        }
        
        // Fetch player stats
        const statsResponse = await playerService.getPlayerStats(id);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Player Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">The requested player could not be found.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
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
      <div className="pt-16 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <PlayerProfile player={player} stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailPage;