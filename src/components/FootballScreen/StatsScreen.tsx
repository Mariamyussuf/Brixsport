
import React, { useState } from 'react';
import { ArrowLeft, Bell, Star } from 'lucide-react';

interface MatchStats {
  possession: [number, number];
  totalShots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  offsides: [number, number];
  throwIns: [number, number];
  yellowCards: [number, number];
}

interface GoalScorer {
  name: string;
  minute: string;
}

interface MatchData {
  competition: string;
  time: string;
  team1: {
    name: string;
    score: number;
    flagColors: { top: string; bottom: string };
    goalScorers: GoalScorer[];
  };
  team2: {
    name: string;
    score: number;
    flagColors: { top: string; bottom: string };
    goalScorers: GoalScorer[];
  };
  stats: MatchStats;
}

const StatsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Lineups' | 'Stats'>('Stats');
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  const matchData: MatchData = {
    competition: 'Busa League',
    time: '2:30',
    team1: {
      name: 'Pirates FC',
      score: 1,
      flagColors: { top: 'bg-blue-600', bottom: 'bg-black' },
      goalScorers: [{ name: 'Omari', minute: "59'" }]
    },
    team2: {
      name: 'Joga FC',
      score: 3,
      flagColors: { top: 'bg-red-600', bottom: 'bg-blue-600' },
      goalScorers: [
        { name: 'Sammy', minute: "33', 71'" },
        { name: 'Aguero', minute: "75'" }
      ]
    },
    stats: {
      possession: [32, 68],
      totalShots: [8, 14],
      shotsOnTarget: [2, 8],
      corners: [3, 6],
      fouls: [9, 2],
      offsides: [4, 7],
      throwIns: [9, 2],
      yellowCards: [1, 1]
    }
  };

  const toggleFavorite = (): void => {
    setIsFavorited(!isFavorited);
  };

  const TeamFlag: React.FC<{ flagColors: { top: string; bottom: string } }> = ({ flagColors }) => (
    <div className="w-12 h-12 rounded-full overflow-hidden flex flex-col">
      <div className={`${flagColors.top} h-1/2 w-full`}></div>
      <div className={`${flagColors.bottom} h-1/2 w-full`}></div>
    </div>
  );

  const StatRow: React.FC<{ 
    statName: string; 
    team1Value: number; 
    team2Value: number;
    team1Flag: { top: string; bottom: string };
    team2Flag: { top: string; bottom: string };
  }> = ({ statName, team1Value, team2Value, team1Flag, team2Flag }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full overflow-hidden flex flex-col">
          <div className={`${team1Flag.top} h-1/2 w-full`}></div>
          <div className={`${team1Flag.bottom} h-1/2 w-full`}></div>
        </div>
        <span className="text-xl font-medium text-gray-900">{team1Value}</span>
      </div>
      
      <span className="text-lg font-medium text-gray-700">{statName}</span>
      
      <div className="flex items-center space-x-4">
        <span className="text-xl font-medium text-gray-900">{team2Value}</span>
        <div className="w-8 h-8 rounded-full overflow-hidden flex flex-col">
          <div className={`${team2Flag.top} h-1/2 w-full`}></div>
          <div className={`${team2Flag.bottom} h-1/2 w-full`}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <ArrowLeft className="w-6 h-6 text-white" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              <h1 className="text-xl font-normal text-white">BrixSports</h1>
            </div>
          </div>
          <Bell className="w-6 h-6 text-white" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('Lineups')}
            className={`pb-2 text-lg font-medium ${
              activeTab === 'Lineups'
                ? 'text-white border-b-2 border-orange-500'
                : 'text-gray-400'
            }`}
          >
            Lineups
          </button>
          <button
            onClick={() => setActiveTab('Stats')}
            className={`pb-2 text-lg font-medium ${
              activeTab === 'Stats'
                ? 'text-white border-b-2 border-orange-500'
                : 'text-gray-400'
            }`}
          >
            Stats
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-gray-100 min-h-screen p-4">
        {/* Match Score Card */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">{matchData.competition}</h2>
            <button onClick={toggleFavorite}>
              <Star
                className={`w-6 h-6 ${
                  isFavorited
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-400'
                }`}
              />
            </button>
          </div>

          <div className="text-center mb-6">
            <span className="text-2xl font-bold text-gray-700">{matchData.time}</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center">
              <TeamFlag flagColors={matchData.team1.flagColors} />
              <span className="text-lg font-medium text-gray-900 mt-2">{matchData.team1.name}</span>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {matchData.team1.score} - {matchData.team2.score}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <TeamFlag flagColors={matchData.team2.flagColors} />
              <span className="text-lg font-medium text-gray-900 mt-2">{matchData.team2.name}</span>
            </div>
          </div>

          {/* Goal Scorers */}
          <div className="flex justify-between text-sm text-gray-600">
            <div className="text-left">
              {matchData.team1.goalScorers.map((scorer, index) => (
                <div key={index}>
                  {scorer.name} {scorer.minute}
                </div>
              ))}
            </div>
            
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              </div>
            </div>

            <div className="text-right">
              {matchData.team2.goalScorers.map((scorer, index) => (
                <div key={index}>
                  {scorer.name} {scorer.minute}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Match Stats */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <TeamFlag flagColors={matchData.team1.flagColors} />
            <h3 className="text-xl font-bold text-gray-900">Match Stats</h3>
            <TeamFlag flagColors={matchData.team2.flagColors} />
          </div>

          <div className="space-y-1">
            <StatRow
              statName="Possession"
              team1Value={matchData.stats.possession[0]}
              team2Value={matchData.stats.possession[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="Total shots"
              team1Value={matchData.stats.totalShots[0]}
              team2Value={matchData.stats.totalShots[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="Shots on target"
              team1Value={matchData.stats.shotsOnTarget[0]}
              team2Value={matchData.stats.shotsOnTarget[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="Corners"
              team1Value={matchData.stats.corners[0]}
              team2Value={matchData.stats.corners[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="Fouls"
              team1Value={matchData.stats.fouls[0]}
              team2Value={matchData.stats.fouls[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="offsides"
              team1Value={matchData.stats.offsides[0]}
              team2Value={matchData.stats.offsides[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="Throw ins"
              team1Value={matchData.stats.throwIns[0]}
              team2Value={matchData.stats.throwIns[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
            <StatRow
              statName="Yellow cards"
              team1Value={matchData.stats.yellowCards[0]}
              team2Value={matchData.stats.yellowCards[1]}
              team1Flag={matchData.team1.flagColors}
              team2Flag={matchData.team2.flagColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;