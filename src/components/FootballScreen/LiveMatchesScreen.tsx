'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiveMatches } from '@/hooks/useHomeData';
import MatchCard from '../shared/MatchCard';
import TrackEventCard from '../shared/TrackEventCard';
import { useI18n } from '../shared/I18nProvider';

interface LiveMatchesScreenProps {
  onBack: () => void;
}

const LiveMatchesScreen: React.FC<LiveMatchesScreenProps> = ({ 
  onBack 
}) => {
  const { liveMatches, loading, error } = useLiveMatches();
  const { t } = useI18n();
  const router = useRouter();

  // Convert match data to UI_Match format
  const convertMatchToUI = (match: any) => {
    return {
      id: match.id.toString(),
      status: 'Live' as const,
      time: match.period ? `${match.current_minute}' ${match.period}` : `${match.current_minute}'`,
      team1: match.home_team_name || `Team ${match.home_team_id}`,
      team2: match.away_team_name || `Team ${match.away_team_id}`,
      score1: match.home_score,
      score2: match.away_score,
      team1Color: match.home_team_logo ? '' : `bg-blue-600`,
      team2Color: match.away_team_logo ? '' : `bg-red-600`,
      sportType: 'football' // Default to football for now
    };
  };

  // Convert track event data to UI format
  const convertTrackEventToUI = (trackEvent: any) => {
    return {
      id: trackEvent.id?.toString(),
      status: 'Live' as const,
      event: trackEvent.event_name || `Track Event ${trackEvent.id}`,
      results: []
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500 dark:text-gray-400">
              {t('loading')}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 md:p-8 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <h3 className="text-lg font-medium">{t('error')}</h3>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasLiveMatches = 
    liveMatches.football.length > 0 || 
    liveMatches.basketball.length > 0 || 
    liveMatches.track.length > 0;

  if (!hasLiveMatches) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 md:p-8 text-center border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('no_live_matches')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('no_live_matches_description')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        {liveMatches.football.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('football')}</h2>
            <div className="space-y-3">
              {liveMatches.football.map((match, index) => (
                <MatchCard key={`live-football-${index}`} match={convertMatchToUI(match)} />
              ))}
            </div>
          </section>
        )}

        {liveMatches.basketball.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('basketball')}</h2>
            <div className="space-y-3">
              {liveMatches.basketball.map((match, index) => (
                <MatchCard key={`live-basketball-${index}`} match={convertMatchToUI(match)} isBasketball={true} />
              ))}
            </div>
          </section>
        )}

        {liveMatches.track.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('track_events')}</h2>
            <div className="space-y-3">
              {liveMatches.track.map((event, index) => (
                <TrackEventCard key={`live-track-${index}`} event={convertTrackEventToUI(event)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LiveMatchesScreen;