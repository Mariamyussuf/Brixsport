"use client";
import React, { useEffect, useState } from 'react';
import { Bell, Star, ArrowLeft, RefreshCw, Filter, Calendar } from 'lucide-react';
import BracketView from './BracketView';
import GroupStageTable, { GroupData } from './GroupStageTable';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/shared/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { LoginPrompt } from '@/components/shared/LoginPrompt';
import { useCompetitions } from '@/hooks/useCompetitions';
import { getTeamsByCompetition } from '@/lib/userTeamService';
import { getMatchesByCompetition } from '@/lib/userMatchService';

interface Competition {
  id: string;
  name: string;
  type: string;
  category: string;
  isActive?: boolean;
  isFavorited?: boolean;
}

// Define the structure for a single row in the standings table
interface StandingsEntry {
  pos: number;
  club: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gd: number;
  pts: number;
}

type FixtureStatus = 'all' | 'live' | 'upcoming' | 'completed';

const CompetitionsScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const { competitions: apiCompetitions, loading, error, refreshCompetitions } = useCompetitions();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [matchTab, setMatchTab] = useState<'fixtures' | 'results' | 'stats' | 'standings'>('fixtures');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [fixtureStatus, setFixtureStatus] = useState<FixtureStatus>('all');
  const [fixtureDate, setFixtureDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const fixtureStatusOptions: { key: FixtureStatus; label: string }[] = [
    { key: 'all', label: t('all') || 'All' },
    { key: 'live', label: t('live') || 'Live' },
    { key: 'upcoming', label: t('upcoming') || 'Upcoming' },
    { key: 'completed', label: t('completed') || 'Completed' }
  ];

  // Convert API competitions to local format
  const competitions = apiCompetitions.map(comp => ({
    id: comp.id.toString(),
    name: comp.name,
    type: comp.type || 'botswana', // Use type directly, default to botswana
    category: comp.category || comp.type || 'SCHOOL COMPETITION',
    isActive: comp.status === 'active',
    isFavorited: favorites.has(comp.id.toString())
  }));

  const toggleFavorite = (id: string): void => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const getFlagColors = (type: string): { top: string; bottom: string } => {
    if (type === 'netherlands') {
      return { top: 'bg-red-600', bottom: 'bg-blue-600' };
    }
    // Botswana flag colors
    return { top: 'bg-blue-600', bottom: 'bg-black' };
  };

  const activeCompetitions = competitions.filter(comp => comp.isActive);
  const allCompetitions = competitions.filter(comp => !comp.isActive);

  // Standings tabs: group/knockout (persist to localStorage)
  const [standingsTab, setStandingsTab] = useState<'group' | 'knockout'>('group');

  // Load persisted tab on mount
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('standingsTab') : null;
      if (saved === 'group' || saved === 'knockout') {
        setStandingsTab(saved as 'group' | 'knockout');
      }
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('standingsTab', standingsTab);
      }
    } catch {}
  }, [standingsTab]);

  // Group data will be fetched from the API
  const [groupData, setGroupData] = useState<GroupData[]>([]);
  const [groupLoading, setGroupLoading] = useState<boolean>(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Fetch group stage data when standings tab is set to 'group'
  useEffect(() => {
    const fetchGroupStageData = async () => {
      if (standingsTab !== 'group' || apiCompetitions.length === 0) return;
      
      setGroupLoading(true);
      setGroupError(null);
      
      try {
        // For now, we'll use the first competition as an example
        // In a real implementation, you might want to let the user select a competition
        const competitionId = apiCompetitions[0]?.id.toString() || 'COMPETITION_ID_PLACEHOLDER';
        
        // Fetch teams and matches for the competition using user-facing services
        const [teams, matches] = await Promise.all([
          getTeamsByCompetition(competitionId),
          getMatchesByCompetition(competitionId)
        ]);

        // Group teams based on match participation
        // In a real implementation, this would come from the competition structure
        // For now, we'll create groups based on match pairings
        const groupsMap: { [key: string]: { name: string; teams: Set<string> } } = {};
        let groupCounter = 1;

        // First, create groups based on matches
        matches.forEach(match => {
          if (match.status === 'full-time') {
            const groupId = `GROUP ${groupCounter}`;
            if (!groupsMap[groupId]) {
              groupsMap[groupId] = {
                name: groupId,
                teams: new Set()
              };
              groupCounter++;
            }
            groupsMap[groupId].teams.add(match.homeTeam);
            groupsMap[groupId].teams.add(match.awayTeam);
          }
        });

        // If no completed matches, create a default group with all teams
        if (Object.keys(groupsMap).length === 0) {
          groupsMap['GROUP 1'] = {
            name: 'GROUP 1',
            teams: new Set(teams.map(team => team.id))
          };
        }

        // Initialize standings for each group
        const groupStandingsMap: { [groupId: string]: { [teamId: string]: StandingsEntry } } = {};
        
        Object.keys(groupsMap).forEach(groupId => {
          groupStandingsMap[groupId] = {};
          const groupTeams = groupsMap[groupId].teams;
          
          groupTeams.forEach(teamId => {
            const team = teams.find(t => t.id === teamId);
            if (team) {
              groupStandingsMap[groupId][teamId] = {
                pos: 0,
                club: team.name,
                played: 0,
                win: 0,
                draw: 0,
                loss: 0,
                gd: 0,
                pts: 0,
              };
            }
          });
        });

        // Process each match and update standings for the appropriate group
        matches.forEach(match => {
          if (match.status !== 'full-time') return; // Only count finished matches

          // Find which group this match belongs to
          let targetGroupId = '';
          for (const groupId in groupsMap) {
            const group = groupsMap[groupId];
            if (group.teams.has(match.homeTeam) && group.teams.has(match.awayTeam)) {
              targetGroupId = groupId;
              break;
            }
          }

          // If we couldn't find a group, skip this match
          if (!targetGroupId || !groupStandingsMap[targetGroupId]) return;

          const standingsMap = groupStandingsMap[targetGroupId];
          const homeTeam = standingsMap[match.homeTeam];
          const awayTeam = standingsMap[match.awayTeam];
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;

          if (homeTeam) {
            homeTeam.played += 1;
            homeTeam.gd += homeScore - awayScore;
          }
          if (awayTeam) {
            awayTeam.played += 1;
            awayTeam.gd += awayScore - homeScore;
          }

          // Determine result
          if (homeScore > awayScore) {
            if (homeTeam) { homeTeam.win += 1; homeTeam.pts += 3; }
            if (awayTeam) { awayTeam.loss += 1; }
          } else if (homeScore < awayScore) {
            if (awayTeam) { awayTeam.win += 1; awayTeam.pts += 3; }
            if (homeTeam) { homeTeam.loss += 1; }
          } else {
            if (homeTeam) { homeTeam.draw += 1; homeTeam.pts += 1; }
            if (awayTeam) { awayTeam.draw += 1; awayTeam.pts += 1; }
          }
        });

        // Convert maps to arrays and sort for each group
        const groupData: GroupData[] = [];
        
        Object.keys(groupStandingsMap).forEach(groupId => {
          const standingsMap = groupStandingsMap[groupId];
          const sortedStandings = Object.values(standingsMap).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.win !== a.win) return b.win - a.win;
            return a.club.localeCompare(b.club);
          });

          // Assign positions
          const finalStandings = sortedStandings.map((entry, index) => ({
            ...entry,
            pos: index + 1,
          }));

          groupData.push({
            name: groupId,
            teams: finalStandings
          });
        });

        setGroupData(groupData);
      } catch (err: any) {
        setGroupError(err.message || 'An error occurred while fetching group stage data');
        console.error('Error fetching group stage data:', err);
      } finally {
        setGroupLoading(false);
      }
    };

    fetchGroupStageData();
  }, [standingsTab, apiCompetitions]);

  const CompetitionItem: React.FC<{ competition: Competition; showBorder?: boolean }> = ({ 
    competition, 
    showBorder = true 
  }) => {
    const flagColors = getFlagColors(competition.type);
    
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-5 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 ${showBorder ? 'mb-4' : ''}`}
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
            <div className={`${flagColors.top} h-1/2 w-full`}></div>
            <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {competition.category}
            </p>
            <h3 className="text-gray-900 dark:text-white text-lg sm:text-xl font-semibold">
              {competition.name}
            </h3>
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(competition.id)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={competition.isFavorited ? t('remove_favorite') || 'Remove from favorites' : t('add_favorite') || 'Add to favorites'}
        >
          <Star
            className={`w-5 h-5 ${
              competition.isFavorited
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading competitions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Competitions</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshCompetitions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-20">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-inner">
                <div className="w-4 h-4 border-2 border-white rounded-full bg-white"></div>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{t('app_title')}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshCompetitions}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
            <Bell className="w-6 h-6 text-gray-900 dark:text-white" />
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto">
            {/* Active Competition Section */}
            <section className="py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('active_competition')}</h2>
                <button
                  onClick={refreshCompetitions}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('refresh') || 'Refresh'}
                </button>
              </div>
              <div>
                {activeCompetitions.length > 0 ? (
                  activeCompetitions.map((competition) => (
                    <CompetitionItem key={competition.id} competition={competition} showBorder={false} />
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 py-4">No active competitions at the moment.</p>
                )}
              </div>
            </section>

            {/* Match/Competition tabs moved to body */}
            <section className="pt-2">
              <div className="inline-flex rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm mb-6">
                {([
                  { key: 'fixtures' as const },
                  { key: 'results' as const },
                  { key: 'stats' as const },
                  { key: 'standings' as const }
                ]).map(({ key }) => (
                  <button
                    key={key}
                    className={`px-4 sm:px-6 py-2 text-sm font-semibold capitalize transition-colors ${
                      matchTab === key
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    } ${key !== 'fixtures' ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}
                    onClick={() => setMatchTab(key)}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </section>

            {/* Content under tabs */}
            {matchTab === 'standings' ? (
              <section className="py-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('standings')}</h2>
                {/* Standings sub-tabs */}
                <div className="inline-flex rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm mb-6">
                  <button
                    className={`px-4 sm:px-6 py-2 text-sm font-semibold capitalize ${
                      standingsTab === 'group'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setStandingsTab('group')}
                  >
                    {t('group_stage')}
                  </button>
                  <button
                    className={`px-4 sm:px-6 py-2 text-sm font-semibold capitalize border-l border-gray-200 dark:border-gray-700 ${
                      standingsTab === 'knockout'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setStandingsTab('knockout')}
                  >
                    {t('knockout_stage')}
                  </button>
                </div>

                {/* Standings content */}
                {standingsTab === 'group' ? (
                  <div>
                    {groupLoading ? (
                      <div className="text-center p-8">Loading group stage data...</div>
                    ) : groupError ? (
                      <div className="text-center p-8 text-red-500">Error: {groupError}</div>
                    ) : (
                      <GroupStageTable groups={groupData} />
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
                    <BracketView competitionId={''} />
                  </div>
                )}
              </section>
            ) : (
              <section className="py-6">
                {matchTab === 'fixtures' && (
                  <>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                          <Filter className="w-4 h-4" />
                          {t('filter_by') || 'Filter by'}
                        </span>
                        {fixtureStatusOptions.map(option => (
                          <button
                            key={option.key}
                            onClick={() => setFixtureStatus(option.key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                              fixtureStatus === option.key
                                ? 'bg-blue-600 text-white border-blue-600 shadow'
                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 shadow-sm">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium hidden sm:inline">{t('date') || 'Date'}</span>
                        <input
                          type="date"
                          value={fixtureDate}
                          onChange={(event) => setFixtureDate(event.target.value)}
                          className="bg-transparent focus:outline-none text-gray-700 dark:text-gray-200"
                        />
                      </label>
                    </div>
                    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-slate-700 dark:text-slate-300 shadow-sm">
                      <p>{t('coming_soon')}</p>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('fixtures_filter_hint') || 'Use the filters above to view fixtures once available.'}
                      </p>
                    </div>
                  </>
                )}
                {matchTab === 'results' && (
                  <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-slate-700 dark:text-slate-300 shadow-sm">
                    <p>{t('coming_soon')}</p>
                  </div>
                )}
                {matchTab === 'stats' && (
                  <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-slate-700 dark:text-slate-300 shadow-sm">
                    <p>{t('coming_soon')}</p>
                  </div>
                )}
              </section>
            )}

            {/* Separator */}
            <div className="border-t border-gray-200 dark:border-gray-800 my-8"></div>

            {/* All Competitions Section */}
            <section className="py-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {t('all_competitions')}
                  </h2>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                    {allCompetitions.length}
                  </span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('back_to_top') || 'Back to top'}
                </button>
              </div>
              <div>
                {allCompetitions.length > 0 ? (
                  allCompetitions.map((competition, index) => (
                    <CompetitionItem 
                      key={competition.id} 
                      competition={competition} 
                      showBorder={index !== allCompetitions.length - 1}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      No competitions available at the moment.
                    </p>
                    <button
                      onClick={refreshCompetitions}
                      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
    </>
  );
};

export default CompetitionsScreen;