'use client';

import React from 'react';
import LiveMatchesScreen from '@/components/FootballScreen/LiveMatchesScreen';
import { I18nProvider } from '@/components/shared/I18nProvider';

const LiveMatchesPage: React.FC = () => {
  return (
    <I18nProvider>
      <LiveMatchesScreen onBack={() => window.history.back()} />
    </I18nProvider>
  );
};

export default LiveMatchesPage;