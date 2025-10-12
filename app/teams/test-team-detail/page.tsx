'use client';

import TeamDetailScreen from '@/screens/TeamDetailScreen';

// Prevent static generation for this page since it depends on URL parameters
export const dynamic = 'force-client';

export default function TestTeamDetailPage() {
  return <TeamDetailScreen />;
}