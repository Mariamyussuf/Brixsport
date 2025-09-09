'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import PlayerProfile from '@/components/FootballScreen/PlayerProfileScreen';

// Mock player data - in a real app this would come from an API
const mockPlayers: Record<string, any> = {
  '1': {
    id: 1,
    number: 1,
    name: 'Davidson',
    position: 'Goalkeeper',
    team: 'Pirates FC',
    image: '',
    stats: {
      gamesPlayed: 15,
      goals: 0,
      assists: 0,
      cleanSheets: 5,
      yellowCards: 1
    }
  },
  '2': {
    id: 2,
    number: 2,
    name: 'Johnson',
    position: 'Left Back',
    team: 'Pirates FC',
    image: '',
    stats: {
      gamesPlayed: 14,
      goals: 1,
      assists: 3,
      cleanSheets: 4,
      yellowCards: 2
    }
  },
  '3': {
    id: 3,
    number: 3,
    name: 'Thiago Silva',
    position: 'Center Back',
    team: 'Pirates FC',
    image: '',
    stats: {
      gamesPlayed: 16,
      goals: 2,
      assists: 1,
      cleanSheets: 6,
      yellowCards: 3
    }
  },
  '10': {
    id: 10,
    number: 10,
    name: 'Marquinhos',
    position: 'Right Winger',
    team: 'Pirates FC',
    image: '',
    stats: {
      gamesPlayed: 16,
      goals: 8,
      assists: 5,
      cleanSheets: 0,
      yellowCards: 1
    }
  },
  '11': {
    id: 11,
    number: 11,
    name: 'Germán Cano',
    position: 'Striker',
    team: 'Pirates FC',
    image: '',
    stats: {
      gamesPlayed: 15,
      goals: 12,
      assists: 3,
      cleanSheets: 0,
      yellowCards: 2
    }
  }
};

const PlayerProfileScreen = () => {
  const params = useParams();
  const router = useRouter();
  
  const playerId = params.id as string;
  const player = mockPlayers[playerId];
  
  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Player Not Found</h2>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="pt-16">
        <PlayerProfile
          playerNumber={player.number}
          playerName={player.name}
          position={player.position}
          playerImage={player.image}
          stats={player.stats}
          topScorers={[
            { id: 1, name: "Germán Cano", teamName: "Pirates FC", goals: 12 },
            { id: 2, name: "Marquinhos", teamName: "Pirates FC", goals: 8 },
            { id: 3, name: "Johnson", teamName: "Pirates FC", goals: 1 },
            { id: 4, name: "Thiago Silva", teamName: "Pirates FC", goals: 2 },
            { id: 5, name: "Unknown Player", teamName: "Other Team", goals: 0 }
          ]}
        />
      </div>
    </div>
  );
};

export default PlayerProfileScreen;