import React, { useState } from 'react';
import { Search, Bell, Star } from 'lucide-react';
import BracketView from './BracketView';

interface Competition {
  id: string;
  name: string;
  type: string;
  category: string;
  isActive?: boolean;
  isFavorited?: boolean;
}

const CompetitionsScreen: React.FC = () => {
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

  const toggleFavorite = (id: string): void => {
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

  const CompetitionItem: React.FC<{ competition: Competition; showBorder?: boolean }> = ({ 
    competition, 
    showBorder = true 
  }) => {
    const flagColors = getFlagColors(competition.type);
    
    return (
      <div className={`flex items-center justify-between py-4 ${showBorder ? 'border-b border-gray-200' : ''}`}>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full overflow-hidden flex flex-col">
            <div className={`${flagColors.top} h-1/2 w-full`}></div>
            <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
              {competition.category}
            </p>
            <h3 className="text-gray-900 text-lg font-medium">
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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
          <h1 className="text-xl font-normal text-white">BrixSports</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Search className="w-6 h-6 text-white" />
          <Bell className="w-6 h-6 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white min-h-screen">
        <div className="px-6">
          {/* Active Competition Section */}
          <section className="py-6">
            <h2 className="text-xl font-medium mb-6 text-gray-900">Active competition</h2>
            <div>
              {activeCompetitions.map((competition) => (
                <CompetitionItem key={competition.id} competition={competition} showBorder={false} />
              ))}
            </div>
          </section>

          {/* Standings (Knockout Bracket) */}
          <section className="py-6">
            <h2 className="text-xl font-medium mb-4 text-gray-900">Standings</h2>
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/40">
              <BracketView />
            </div>
          </section>

          {/* Separator */}
          <div className="border-t border-gray-200"></div>

          {/* All Competitions Section */}
          <section className="py-6">
            <h2 className="text-xl font-medium mb-6 text-gray-900 flex items-center space-x-2">
              <span>All competitions</span>
              <span className="text-gray-500">• {allCompetitions.length}</span>
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