'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import MatchDetailScreen from '@/screens/MatchDetailScreen';

const MatchDetailsPage = () => {
  const params = useParams();
  const matchId = params.id as string;

  // Convert string ID to number
  const matchIdNumber = parseInt(matchId, 10);

  if (isNaN(matchIdNumber)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Invalid Match ID</h2>
          <p className="text-gray-600 dark:text-gray-400">The provided match ID is not valid.</p>
        </div>
      </div>
    );
  }

  return <MatchDetailScreen matchId={matchIdNumber} />;
};

export default MatchDetailsPage;
