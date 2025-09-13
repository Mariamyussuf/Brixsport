'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import IntelligentMatchHeader from '@/components/FootballScreen/IntelligentMatchHeader';
import { useScrollDetection } from '@/hooks/useScrollDetection';

const DemoIntelligentHeader = () => {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const { isScrolled } = useScrollDetection({ shrinkThreshold: 50, expandThreshold: 20 });

  // Mock match data for demonstration
  const mockMatch = {
    id: '1',
    homeTeam: { id: '1', name: 'Pirates FC' },
    awayTeam: { id: '2', name: 'Joga FC' },
    homeScore: 0,
    awayScore: 1,
    time: '71\'',
    status: 'live',
    competition: 'Busa League',
    date: 'Today',
    venue: 'Main Stadium',
    homeFlagColors: { top: 'bg-blue-600', bottom: 'bg-black' },
    awayFlagColors: { top: 'bg-red-600', bottom: 'bg-blue-600' }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <IntelligentMatchHeader
        match={mockMatch}
        isFavorited={isFavorited}
        isScrolled={isScrolled}
        onBack={() => router.back()}
        onToggleFavorite={toggleFavorite}
      />

      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Intelligent Header Demo</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">How It Works</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Scroll down to see the header shrink into a compact version. Scroll back up to expand it again.
          </p>
          
          <div className="flex items-center space-x-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${isScrolled ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-gray-700 dark:text-gray-300">
              Header state: {isScrolled ? 'Compact' : 'Full'}
            </span>
          </div>
        </div>

        {/* Demo content to enable scrolling */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Section {i + 1}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This is demo content to enable scrolling. Scroll down to see the intelligent header in action.
              The header will shrink when you scroll past 50px and expand when you scroll back to the top.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemoIntelligentHeader;