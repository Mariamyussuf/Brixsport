'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import MatchDetailScreen from '@/screens/MatchDetailScreen';

const MatchDetailsPage = () => {
  const params = useParams();
  const matchId = params.id as string;
  return <MatchDetailScreen matchId={matchId} />;
};

export default MatchDetailsPage;
