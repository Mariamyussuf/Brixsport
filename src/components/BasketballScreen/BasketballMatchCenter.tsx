import React, { useState } from 'react';
import { 
  Trophy, Clock, Users, TrendingUp, BarChart3, Activity, 
  ArrowUp, ArrowDown, Timer, MapPin, Calendar, Shield,
  Star, ChevronRight, Award, Target, Zap, Eye, Info,
  AlertCircle, ChevronDown, ChevronUp, Flame, Wind
} from 'lucide-react';

// Match Header Component
const MatchHeader = ({ homeTeam, awayTeam, homeScore, awayScore, quarter, timeRemaining, date, venue, league }) => {
  const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : null;
  
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl shadow-2xl overflow-hidden">
      {/* League and Date Bar */}
      <div className="bg-black/20 backdrop-blur-sm px-3 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-yellow-400" />
          <span className="font-medium truncate">{league}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-300 mt-1 sm:mt-0">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{date}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm truncate">{venue}</span>
          </div>
        </div>
      </div>
      
      {/* Main Score Section */}
      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          {/* Home Team */}
          <div className={`flex-1 text-center ${winner === 'home' ? 'opacity-100' : 'opacity-70'}`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-base sm:text-lg md:text-2xl font-bold">{homeTeam.substring(0, 3).toUpperCase()}</span>
            </div>
            <h3 className="text-sm sm:text-base md:text-xl font-bold mb-1 truncate px-1">{homeTeam}</h3>
            <div className="text-2xl sm:text-3xl md:text-5xl font-bold">
              {homeScore}
              {winner === 'home' && <Trophy className="inline-block w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 ml-1 sm:ml-2 text-yellow-400" />}
            </div>
          </div>
          
          {/* Center Info */}
          <div className="flex-1 text-center px-2">
            <div className="mb-2 sm:mb-3 md:mb-4">
              <div className={`inline-flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-1 md:px-4 md:py-2 rounded-full text-xs sm:text-sm md:text-base ${
                quarter === 'Final' ? 'bg-red-500' : 'bg-green-500 animate-pulse'
              }`}>
                <Clock className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                <span className="font-bold">{quarter}</span>
              </div>
            </div>
            {timeRemaining && (
              <div className="text-xl sm:text-2xl md:text-3xl font-mono font-bold">{timeRemaining}</div>
            )}
            <div className="text-xs sm:text-xs md:text-sm text-slate-400 mt-1">VS</div>
          </div>
          
          {/* Away Team */}
          <div className={`flex-1 text-center ${winner === 'away' ? 'opacity-100' : 'opacity-70'}`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-2 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-base sm:text-lg md:text-2xl font-bold">{awayTeam.substring(0, 3).toUpperCase()}</span>
            </div>
            <h3 className="text-sm sm:text-base md:text-xl font-bold mb-1 truncate px-1">{awayTeam}</h3>
            <div className="text-2xl sm:text-3xl md:text-5xl font-bold">
              {awayScore}
              {winner === 'away' && <Trophy className="inline-block w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 ml-1 sm:ml-2 text-yellow-400" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quarter Breakdown Component
const QuarterBreakdown = ({ quarters }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-slate-50 dark:bg-gray-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center">
          <Timer className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Quarter by Quarter
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Team</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Q1</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Q2</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Q3</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Q4</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">OT</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-gray-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {quarters.map((team, index) => (
              <tr key={index} className="border-t dark:border-gray-700">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{team.name}</td>
                <td className="px-4 py-3 text-center font-semibold">{team.q1}</td>
                <td className="px-4 py-3 text-center font-semibold">{team.q2}</td>
                <td className="px-4 py-3 text-center font-semibold">{team.q3}</td>
                <td className="px-4 py-3 text-center font-semibold">{team.q4}</td>
                <td className="px-4 py-3 text-center font-semibold">{team.ot || '-'}</td>
                <td className="px-4 py-3 text-center font-bold text-lg bg-slate-50 dark:bg-gray-700">{team.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Team Stats Component
const TeamStats = ({ stats }) => {
  const StatBar = ({ label, home, away, reverse = false }) => {
    const total = home + away;
    const homePercent = total > 0 ? (home / total) * 100 : 50;
    const awayPercent = total > 0 ? (away / total) * 100 : 50;
    const homeBetter = reverse ? home < away : home > away;
    
    return (
      <div className="py-2 sm:py-3">
        <div className="flex justify-between mb-1 sm:mb-2">
          <span className={`font-bold text-base sm:text-lg ${homeBetter ? 'text-blue-600' : 'text-slate-600'}`}>{home}</span>
          <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 truncate px-1">{label}</span>
          <span className={`font-bold text-base sm:text-lg ${!homeBetter ? 'text-red-600' : 'text-slate-600'}`}>{away}</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div 
            className={`h-full ${homeBetter ? 'bg-blue-500' : 'bg-blue-300'} transition-all duration-700`}
            style={{ width: `${homePercent}%` }}
          />
          <div 
            className={`h-full ${!homeBetter ? 'bg-red-500' : 'bg-red-300'} transition-all duration-700`}
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="p-4 bg-slate-50 dark:bg-gray-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Team Statistics
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <StatBar label="Field Goals Made" home={stats.fgMade.home} away={stats.fgMade.away} />
        <StatBar label="Field Goal %" home={stats.fgPercent.home} away={stats.fgPercent.away} />
        <StatBar label="3-Pointers Made" home={stats.threePtMade.home} away={stats.threePtMade.away} />
        <StatBar label="3-Point %" home={stats.threePtPercent.home} away={stats.threePtPercent.away} />
        <StatBar label="Free Throws Made" home={stats.ftMade.home} away={stats.ftMade.away} />
        <StatBar label="Free Throw %" home={stats.ftPercent.home} away={stats.ftPercent.away} />
        <StatBar label="Total Rebounds" home={stats.rebounds.home} away={stats.rebounds.away} />
        <StatBar label="Offensive Rebounds" home={stats.offRebounds.home} away={stats.offRebounds.away} />
        <StatBar label="Assists" home={stats.assists.home} away={stats.assists.away} />
        <StatBar label="Steals" home={stats.steals.home} away={stats.steals.away} />
        <StatBar label="Blocks" home={stats.blocks.home} away={stats.blocks.away} />
        <StatBar label="Turnovers" home={stats.turnovers.home} away={stats.turnovers.away} reverse />
        <StatBar label="Personal Fouls" home={stats.fouls.home} away={stats.fouls.away} reverse />
        <StatBar label="Fast Break Points" home={stats.fastBreak.home} away={stats.fastBreak.away} />
        <StatBar label="Points in Paint" home={stats.pointsInPaint.home} away={stats.pointsInPaint.away} />
        <StatBar label="Bench Points" home={stats.benchPoints.home} away={stats.benchPoints.away} />
      </div>
    </div>
  );
};

// Player Stats Component
const PlayerStats = ({ players, team }) => {
  const [sortBy, setSortBy] = useState('points');
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  
  const sortedPlayers = [...players].sort((a, b) => b[sortBy] - a[sortBy]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="p-4 bg-slate-50 dark:bg-gray-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          {team} - Player Statistics
        </h3>
      </div>
      
      {/* Sort Options */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex space-x-2 overflow-x-auto">
          {['points', 'rebounds', 'assists', 'minutes'].map(stat => (
            <button
              key={stat}
              onClick={() => setSortBy(stat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                sortBy === stat 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {stat.charAt(0).toUpperCase() + stat.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Players List */}
      <div className="divide-y dark:divide-gray-700">
        {sortedPlayers.map((player, index) => (
          <div key={index} className="p-4 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedPlayer(expandedPlayer === index ? null : index)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                  {player.number}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                    {player.name}
                    {player.starter && <Star className="w-4 h-4 ml-1 text-yellow-500" />}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{player.position}</div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{player.points}</div>
                  <div className="text-xs text-slate-500">PTS</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{player.rebounds}</div>
                  <div className="text-xs text-slate-500">REB</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{player.assists}</div>
                  <div className="text-xs text-slate-500">AST</div>
                </div>
                {expandedPlayer === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
            
            {/* Expanded Stats */}
            {expandedPlayer === index && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">MIN:</span> <span className="font-semibold">{player.minutes}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">FG:</span> <span className="font-semibold">{player.fgMade}/{player.fgAttempts}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">3PT:</span> <span className="font-semibold">{player.threePtMade}/{player.threePtAttempts}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">FT:</span> <span className="font-semibold">{player.ftMade}/{player.ftAttempts}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">STL:</span> <span className="font-semibold">{player.steals}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">BLK:</span> <span className="font-semibold">{player.blocks}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">TO:</span> <span className="font-semibold">{player.turnovers}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">PF:</span> <span className="font-semibold">{player.fouls}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">+/-:</span> <span className="font-semibold">{player.plusMinus > 0 ? '+' : ''}{player.plusMinus}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Play by Play Component
const PlayByPlay = ({ plays }) => {
  const getPlayIcon = (type) => {
    switch(type) {
      case 'score': return <Target className="w-4 h-4 text-green-500" />;
      case 'three': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'foul': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'timeout': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'substitution': return <Users className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="p-4 bg-slate-50 dark:bg-gray-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Play-by-Play
        </h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {plays.map((play, index) => (
          <div key={index} className="p-4 border-b dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getPlayIcon(play.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{play.time}</span>
                  {play.score && (
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {play.score}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">
                  {play.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Basketball Match Center Component
const BasketballMatchCenter = ({ match }: { match: any }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample data - would come from API in real app
  const matchData = {
    homeTeam: match.homeTeam || 'Home Team',
    awayTeam: match.awayTeam || 'Away Team',
    homeScore: match.homeScore || 0,
    awayScore: match.awayScore || 0,
    quarter: match.quarter || match.time || 'Final',
    timeRemaining: null,
    date: match.date || 'Today',
    venue: match.venue || 'Unknown Venue',
    league: match.competition || 'Basketball League'
  };
  
  const quarters = [
    { name: matchData.homeTeam, q1: 28, q2: 32, q3: 30, q4: 28, ot: null, total: matchData.homeScore },
    { name: matchData.awayTeam, q1: 30, q2: 28, q3: 29, q4: 27, ot: null, total: matchData.awayScore }
  ];
  
  const teamStats = {
    fgMade: { home: 45, away: 42 },
    fgPercent: { home: 52, away: 48 },
    threePtMade: { home: 12, away: 15 },
    threePtPercent: { home: 38, away: 42 },
    ftMade: { home: 16, away: 15 },
    ftPercent: { home: 84, away: 79 },
    rebounds: { home: 48, away: 43 },
    offRebounds: { home: 12, away: 9 },
    assists: { home: 28, away: 25 },
    steals: { home: 8, away: 7 },
    blocks: { home: 6, away: 4 },
    turnovers: { home: 12, away: 14 },
    fouls: { home: 18, away: 20 },
    fastBreak: { home: 18, away: 12 },
    pointsInPaint: { home: 48, away: 42 },
    benchPoints: { home: 35, away: 28 }
  };
  
  const homePlayers = [
    { number: 23, name: 'L. James', position: 'SF', starter: true, points: 28, rebounds: 10, assists: 11, 
      minutes: '38:22', fgMade: 11, fgAttempts: 19, threePtMade: 2, threePtAttempts: 5, 
      ftMade: 4, ftAttempts: 5, steals: 2, blocks: 1, turnovers: 3, fouls: 2, plusMinus: 8 },
    { number: 3, name: 'A. Davis', position: 'PF', starter: true, points: 26, rebounds: 15, assists: 3,
      minutes: '36:15', fgMade: 10, fgAttempts: 18, threePtMade: 1, threePtAttempts: 3,
      ftMade: 5, ftAttempts: 6, steals: 1, blocks: 3, turnovers: 2, fouls: 3, plusMinus: 6 },
    { number: 1, name: 'D. Russell', position: 'PG', starter: true, points: 22, rebounds: 3, assists: 9,
      minutes: '34:45', fgMade: 8, fgAttempts: 15, threePtMade: 4, threePtAttempts: 8,
      ftMade: 2, ftAttempts: 2, steals: 2, blocks: 0, turnovers: 4, fouls: 3, plusMinus: -2 }
  ];
  
  const awayPlayers = [
    { number: 30, name: 'S. Curry', position: 'PG', starter: true, points: 31, rebounds: 4, assists: 8,
      minutes: '37:12', fgMade: 10, fgAttempts: 22, threePtMade: 7, threePtAttempts: 14,
      ftMade: 4, ftAttempts: 4, steals: 1, blocks: 0, turnovers: 3, fouls: 2, plusMinus: -2 },
    { number: 11, name: 'K. Thompson', position: 'SG', starter: true, points: 25, rebounds: 3, assists: 3,
      minutes: '35:28', fgMade: 9, fgAttempts: 18, threePtMade: 5, threePtAttempts: 11,
      ftMade: 2, ftAttempts: 2, steals: 1, blocks: 1, turnovers: 2, fouls: 3, plusMinus: -6 },
    { number: 23, name: 'D. Green', position: 'PF', starter: true, points: 12, rebounds: 11, assists: 7,
      minutes: '32:45', fgMade: 5, fgAttempts: 9, threePtMade: 1, threePtAttempts: 3,
      ftMade: 1, ftAttempts: 2, steals: 2, blocks: 2, turnovers: 4, fouls: 4, plusMinus: -3 }
  ];
  
  const plays = [
    { time: 'Q4 0:15', type: 'score', description: 'LeBron James makes driving layup', score: '118-114' },
    { time: 'Q4 0:28', type: 'three', description: 'Stephen Curry misses 28-foot three point jumper', score: '116-114' },
    { time: 'Q4 0:45', type: 'timeout', description: 'Warriors Full Timeout', score: '116-114' },
    { time: 'Q4 0:52', type: 'score', description: 'Anthony Davis makes free throw 2 of 2', score: '116-114' },
    { time: 'Q4 0:52', type: 'score', description: 'Anthony Davis makes free throw 1 of 2', score: '115-114' },
    { time: 'Q4 0:52', type: 'foul', description: 'Draymond Green personal foul', score: '114-114' },
    { time: 'Q4 1:12', type: 'three', description: 'Klay Thompson makes 26-foot three pointer (Curry assists)', score: '114-114' }
  ];
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> },
    { id: 'playbyplay', label: 'Play-by-Play', icon: <Activity className="w-4 h-4" /> }
  ];
  
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900 p-2 sm:p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Match Header */}
        <MatchHeader {...matchData} />
        
        {/* Navigation Tabs - Compact and Cute Design */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-1.5">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg font-medium transition-all duration-200 text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="mb-1">
                  {tab.icon}
                </div>
                <span className="leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {activeTab === 'overview' && (
            <>
              <QuarterBreakdown quarters={quarters} />
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                <TeamStats stats={teamStats} />
                <PlayByPlay plays={plays} />
              </div>
            </>
          )}
          
          {activeTab === 'stats' && (
            <TeamStats stats={teamStats} />
          )}
          
          {activeTab === 'players' && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              <PlayerStats players={homePlayers} team={matchData.homeTeam} />
              <PlayerStats players={awayPlayers} team={matchData.awayTeam} />
            </div>
          )}
          
          {activeTab === 'playbyplay' && (
            <PlayByPlay plays={plays} />
          )}
        </div>
        
        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">Attendance</div>
                <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">18,997</div>
              </div>
              <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">Game Duration</div>
                <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">2h 28m</div>
              </div>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-xs md:text-sm text-slate-500 dark:text-slate-400">Lead Changes</div>
                <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">14</div>
              </div>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballMatchCenter;