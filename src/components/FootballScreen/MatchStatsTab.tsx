import React from 'react';

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

const MatchStatsTab: React.FC = () => {
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

  const TeamFlag: React.FC<{ flagColors: { top: string; bottom: string } }> = ({ flagColors }) => (
    <div className="w-8 h-8 rounded-full overflow-hidden flex flex-col">
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
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <div className="flex items-center space-x-4">
        <TeamFlag flagColors={team1Flag} />
        <span className="text-lg font-medium text-gray-900">{team1Value}</span>
      </div>
      
      <span className="text-base font-medium text-gray-700">{statName}</span>
      
      <div className="flex items-center space-x-4">
        <span className="text-lg font-medium text-gray-900">{team2Value}</span>
        <TeamFlag flagColors={team2Flag} />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg">
      {/* Match Score Card */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">{matchData.competition}</h2>
        </div>

        <div className="text-center mb-6">
          <span className="text-xl font-bold text-gray-700">{matchData.time}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-center">
            <TeamFlag flagColors={matchData.team1.flagColors} />
            <span className="text-base font-medium text-gray-900 mt-2">{matchData.team1.name}</span>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {matchData.team1.score} - {matchData.team2.score}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <TeamFlag flagColors={matchData.team2.flagColors} />
            <span className="text-base font-medium text-gray-900 mt-2">{matchData.team2.name}</span>
          </div>
        </div>

        {/* Goal Scorers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Goals</h3>
            {matchData.team1.goalScorers.map((scorer, index) => (
              <div key={index} className="text-sm text-gray-700">
                {scorer.name} <span className="text-gray-500">{scorer.minute}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">&nbsp;</h3>
            {matchData.team2.goalScorers.map((scorer, index) => (
              <div key={index} className="text-sm text-gray-700">
                {scorer.name} <span className="text-gray-500">{scorer.minute}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Match Statistics</h2>
        <div className="space-y-2">
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
            statName="Offsides"
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
  );
};

export default MatchStatsTab;