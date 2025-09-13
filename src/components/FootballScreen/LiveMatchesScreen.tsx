import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/shared/I18nProvider';
import { UI_MatchCardProps, UI_TrackEventCardProps, UI_TeamLogoProps } from '@/types/campus';
import { getLiveMatches } from '@/lib/userMatchService';

interface LiveMatchesScreenProps {
  onBack: () => void;
}

const LiveMatchesScreen: React.FC<LiveMatchesScreenProps> = ({ 
  onBack 
}) => {
  const { t } = useI18n();
  const router = useRouter();
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [trackEvents, setTrackEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch live matches from API
        const matches = await getLiveMatches();
        
        // Ensure matches is an array before trying to map over it
        const matchesArray = Array.isArray(matches) ? matches : [];
        
        // Transform matches to the format expected by the UI
        const transformedMatches = matchesArray.map(match => ({
          id: match.id,
          team1: match.homeTeam,
          team2: match.awayTeam,
          score1: match.homeScore,
          score2: match.awayScore,
          time: match.date,
          status: match.status === 'live' ? 'Live' : match.status,
          sportType: 'football', // This would come from the match data in a real implementation
          team1Color: 'bg-blue-500', // This would come from team data in a real implementation
          team2Color: 'bg-red-500'   // This would come from team data in a real implementation
        }));
        
        setLiveMatches(transformedMatches);
        
        // Track events would come from a separate API in a real implementation
        // For now, we'll keep them as empty array
        setTrackEvents([]);
      } catch (err: any) {
        console.error('Error fetching live matches:', err);
        setError(err.message || 'Failed to load live matches');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();
    
    // Set up polling to refresh live matches every 30 seconds
    const interval = setInterval(fetchLiveMatches, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced responsive components
  const TeamLogo: React.FC<UI_TeamLogoProps> = ({ color }) => (
    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${color} rounded-sm flex items-center justify-center flex-shrink-0`}>
      <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white dark:bg-gray-800 rounded-sm opacity-80"></div>
    </div>
  );

  const MatchCard: React.FC<UI_MatchCardProps> = ({ match, isBasketball = false }) => (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 touch-manipulation cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={() => {
        // Navigate to match details page using the match ID
        if (match.id) {
          router.push(`/match/${match.id}`);
        } else {
          // Fallback to default match if no ID is available
          router.push(`/match/match-1`);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2">
          {match.status === 'Live' && (
            <span className="bg-green-500 text-white px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium animate-pulse">
              {t('live')}
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">{match.time}</span>
        </div>
      </div>
      
      {/* Mobile-optimized match layout */}
      <div className="flex items-center justify-between">
        {/* Team 1 */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
          <TeamLogo color={match.team1Color} />
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">{match.team1}</span>
        </div>
        
        {/* Score/VS - centered on both mobile and desktop for consistency */}
        <div className="px-2 sm:px-4 min-w-[80px] sm:min-w-[100px] flex justify-center">
          {match.status === 'Live' && match.score1 !== undefined && match.score2 !== undefined ? (
            <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              {match.score1} - {match.score2}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-base">{t('vs')}</span>
          )}
        </div>
        
        {/* Team 2 */}
        <div className="flex items-center space-x-2 sm:space-x-3 justify-end flex-1">
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">{match.team2}</span>
          <TeamLogo color={match.team2Color} />
        </div>
      </div>
    </div>
  );

  const TrackEventCard: React.FC<UI_TrackEventCardProps> = ({ event }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 touch-manipulation">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium text-white w-fit ${
          event.status === 'Ended' ? 'bg-red-500' : 
          event.status === 'Live' ? 'bg-green-500' : 'bg-gray-500'
        }`}>
          {event.status}
        </span>
        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">{event.event}</span>
      </div>
      
      <div className="space-y-1.5 sm:space-y-2">
        {/* Ensure results is an array before mapping */}
        {Array.isArray(event.results) && event.results.map((result, index) => (
          <div key={index} className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-gray-600 dark:text-gray-300 font-medium w-8 sm:w-10 text-xs sm:text-sm">{result.position}</span>
            <span className="text-gray-800 dark:text-gray-100 text-xs sm:text-sm">{result.team}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Group matches by sport type
  const footballMatches = liveMatches.filter(match => match.sportType === 'football');
  const basketballMatches = liveMatches.filter(match => match.sportType === 'basketball');
  const liveTrackEvents = trackEvents.filter(event => event.status === 'Live');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white sticky top-0 z-30">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Back button and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <button
                  onClick={onBack}
                  aria-label="Back"
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                  type="button"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                </button>
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {t('live_events')}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white sticky top-0 z-30">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Back button and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <button
                  onClick={onBack}
                  aria-label="Back"
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                  type="button"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                </button>
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {t('live_events')}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white sticky top-0 z-30">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Back button and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={onBack}
                aria-label="Back"
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </button>
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {t('live_events')}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        {liveMatches.length === 0 && liveTrackEvents.length === 0 ? (
          <section>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 sm:p-6 md:p-8 text-center border border-gray-100 dark:border-gray-700">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-300 dark:text-slate-500 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 dark:text-gray-300 text-sm sm:text-base mb-1 sm:mb-2">
                {t('no_live_matches')}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-400">{t('check_back_later')}</p>
            </div>
          </section>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Football Section */}
            {footballMatches.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">
                  {t('football')}
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {footballMatches.map((match, index) => (
                    <MatchCard key={`football-live-${index}`} match={match} />
                  ))}
                </div>
              </section>
            )}

            {/* Basketball Section */}
            {basketballMatches.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">
                  {t('basketball')}
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {basketballMatches.map((match, index) => (
                    <MatchCard key={`basketball-live-${index}`} match={match} isBasketball={true} />
                  ))}
                </div>
              </section>
            )}

            {/* Track Events Section */}
            {liveTrackEvents.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">
                  {t('track_events')}
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {liveTrackEvents.map((event, index) => (
                    <TrackEventCard key={`track-live-${index}`} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatchesScreen;