"use client";
import React, { useEffect, useState } from 'react';
import { Bell, Star, ArrowLeft } from 'lucide-react';
import BracketView from './BracketView';
import GroupStageTable, { GroupData } from './GroupStageTable';
import { useRouter } from 'next/navigation';

interface Competition {
  id: string;
  name: string;
  type: string;
  category: string;
  isActive?: boolean;
  isFavorited?: boolean;
}

const CompetitionsScreen: React.FC = () => {
  const router = useRouter();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');
  const [matchTab, setMatchTab] = useState<'fixtures' | 'results' | 'stats' | 'standings'>('fixtures');
  const [competitions, setCompetitions] = useState<Competition[]>([
    {
      id: '1',
      name: 'NPUGA',
      type: 'netherlands',
      category: 'SCHOOL COMPETITION',
      isActive: true,
      isFavorited: false
    },
    {
      id: '2',
      name: 'Play Ball Africa',
      type: 'botswana',
      category: 'SCHOOL COMPETITION',
      isFavorited: false
    },
    {
      id: '3',
      name: 'BUSA League',
      type: 'botswana',
      category: 'BELLS INTER-TEAM COMPETITION',
      isFavorited: false
    },
    {
      id: '4',
      name: 'Convocation Match',
      type: 'botswana',
      category: 'SCHOOL COMPETITION',
      isFavorited: false
    },
    {
      id: '5',
      name: 'BEUSA Inter-department cup',
      type: 'botswana',
      category: 'ENGINEERING COMPETITION',
      isFavorited: false
    },
    {
      id: '6',
      name: 'Inter-College cup',
      type: 'botswana',
      category: 'COLLEGE COMPETITION',
      isFavorited: false
    },
    {
      id: '7',
      name: 'Bells Friendlies',
      type: 'botswana',
      category: 'BELLS FRIENDLY MATCHES',
      isFavorited: false
    },
    {
      id: '8',
      name: 'Bells Team Matches',
      type: 'botswana',
      category: 'SCHOOL COMPETITION',
      isFavorited: false
    }
  ]);

  const requireAuth = (next: string = '/?tab=Competition'): boolean => {
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent(next)}`);
      return true;
    }
    return false;
  };

  const toggleFavorite = (id: string): void => {
    if (requireAuth()) return;
    setCompetitions(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, isFavorited: !comp.isFavorited } : comp
      )
    );
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
        setStandingsTab(saved);
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

  // Mock group data for Group stage table (replace with real data later)
  const groupData: GroupData[] = [
    {
      name: 'GROUP 1',
      teams: [
        { pos: 1, club: 'Allianz', played: 10, win: 4, draw: 0, loss: 0, gd: 16, pts: 12 },
        { pos: 2, club: 'Kings', played: 10, win: 2, draw: 2, loss: 0, gd: 10, pts: 10 },
        { pos: 3, club: 'Pirates', played: 10, win: 2, draw: 1, loss: 2, gd: 4, pts: 7 },
        { pos: 4, club: 'Spartans', played: 10, win: 1, draw: 2, loss: 3, gd: -2, pts: 4 },
      ],
    },
    {
      name: 'GROUP 2',
      teams: [
        { pos: 1, club: 'Allianz', played: 10, win: 4, draw: 0, loss: 0, gd: 16, pts: 12 },
        { pos: 2, club: 'Kings', played: 10, win: 2, draw: 2, loss: 0, gd: 10, pts: 10 },
        { pos: 3, club: 'Pirates', played: 10, win: 2, draw: 1, loss: 2, gd: 4, pts: 7 },
        { pos: 4, club: 'Spartans', played: 10, win: 1, draw: 2, loss: 3, gd: -2, pts: 4 },
      ],
    },
  ];

  const CompetitionItem: React.FC<{ competition: Competition; showBorder?: boolean }> = ({ 
    competition, 
    showBorder = true 
  }) => {
    const flagColors = getFlagColors(competition.type);
    
    return (
      <div className={`flex items-center justify-between py-4 ${showBorder ? 'border-b border-gray-200 dark:border-white/10' : ''}`}>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full overflow-hidden flex flex-col">
            <div className={`${flagColors.top} h-1/2 w-full`}></div>
            <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 uppercase tracking-wide font-medium">
              {competition.category}
            </p>
            <h3 className="text-gray-900 dark:text-white text-lg font-medium">
              {competition.name}
            </h3>
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(competition.id)}
          className="p-1"
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

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white">BrixSports</h1>
          </div>
        </div>
        <div className="flex items-center">
          <Bell className="w-6 h-6 text-slate-900 dark:text-white" />
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900/40 min-h-screen text-slate-900 dark:text-slate-100">
        <div className="px-6">
          {/* Active Competition Section */}
          <section className="py-6">
            <h2 className="text-xl font-medium mb-6 text-gray-900 dark:text-white">Active competition</h2>
            <div>
              {activeCompetitions.map((competition) => (
                <CompetitionItem key={competition.id} competition={competition} showBorder={false} />
              ))}
            </div>
          </section>

          {/* Match/Competition tabs moved to body */}
          <section className="pt-2">
            <div className="inline-flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 mb-4">
              {([
                { key: 'fixtures', label: 'Fixtures' },
                { key: 'results', label: 'Results' },
                { key: 'stats', label: 'Stats' },
                { key: 'standings', label: 'Standings' }
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  className={`px-4 py-2 text-sm font-medium ${
                    matchTab === key
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                  } ${key !== 'fixtures' ? 'border-l border-gray-200 dark:border-white/10' : ''}`}
                  onClick={() => setMatchTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Content under tabs */}
          {matchTab === 'standings' ? (
            <section className="py-6">
              <h2 className="text-xl font-medium mb-4 text-gray-900">Standings</h2>
              {/* Standings sub-tabs */}
              <div className="inline-flex rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    standingsTab === 'group'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                  }`}
                  onClick={() => setStandingsTab('group')}
                >
                  Group stage
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-200 dark:border-white/10 ${
                    standingsTab === 'knockout'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'bg-gray-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                  }`}
                  onClick={() => setStandingsTab('knockout')}
                >
                  Knockout stage
                </button>
              </div>

              {/* Standings content */}
              {standingsTab === 'group' ? (
                <GroupStageTable groups={groupData} />
              ) : (
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/40">
                  <BracketView />
                </div>
              )}
            </section>
          ) : (
            <section className="py-6">
              {matchTab === 'fixtures' && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/40 p-6 text-slate-700 dark:text-slate-300">
                  <p>Fixtures content coming soon.</p>
                </div>
              )}
              {matchTab === 'results' && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/40 p-6 text-slate-700 dark:text-slate-300">
                  <p>Results content coming soon.</p>
                </div>
              )}
              {matchTab === 'stats' && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/40 p-6 text-slate-700 dark:text-slate-300">
                  <p>Stats content coming soon.</p>
                </div>
              )}
            </section>
          )}

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-white/10"></div>

          {/* All Competitions Section */}
          <section className="py-6">
            <h2 className="text-xl font-medium mb-6 text-gray-900 dark:text-white flex items-center space-x-2">
              <span>All competitions</span>
              <span className="text-gray-500 dark:text-slate-400">• {allCompetitions.length}</span>
            </h2>
            <div>
              {allCompetitions.map((competition, index) => (
                <CompetitionItem 
                  key={competition.id} 
                  competition={competition} 
                  showBorder={index !== allCompetitions.length - 1}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CompetitionsScreen;