'use client';

import TeamDetailScreen from '@/screens/TeamDetailScreen';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading team data...</p>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TeamDetailScreen />
    </Suspense>
  );
}