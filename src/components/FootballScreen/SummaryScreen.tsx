import React from 'react';

interface MatchSummaryProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  matchVenue?: string;
  matchStats?: {
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    corners: [number, number];
    fouls: [number, number];
  };
  events?: Array<{
    time: number;
    team: 'home' | 'away';
    player: string;
    eventType: 'goal' | 'yellow' | 'red' | 'substitution';
    assistBy?: string;
  }>;
}

const SummaryScreen: React.FC<MatchSummaryProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  matchDate,
  matchVenue,
  matchStats,
  events
}) => {
  return (
    <div 
      className="relative min-h-screen flex flex-col justify-start items-center text-white bg-black" 
      // Using separate style properties instead of shorthand to avoid conflicts
      style={{ 
        backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      {/* Header with match teams and score */}
      <div className="w-full px-4 py-6 bg-gradient-to-r from-blue-900/80 to-indigo-900/80">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold">{homeTeam}</h2>
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              {/* Team logo placeholder */}
              <span className="text-2xl font-bold">{homeTeam.substring(0, 2)}</span>
            </div>
          </div>
          
          <div className="text-center px-4">
            <div className="text-3xl font-bold tracking-wider">
              {homeScore} - {awayScore}
            </div>
            <div className="text-sm text-gray-300">{matchDate}</div>
          </div>
          
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold">{awayTeam}</h2>
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              {/* Team logo placeholder */}
              <span className="text-2xl font-bold">{awayTeam.substring(0, 2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Match venue if provided */}
      {matchVenue && (
        <div className="text-center py-2 bg-gray-800/50 w-full">
          <p className="text-sm">{matchVenue}</p>
        </div>
      )}
      
      {/* Match stats */}
      {matchStats && (
        <div className="w-full max-w-md mx-auto mt-8 px-4">
          <h3 className="text-xl font-semibold mb-4 text-center">Match Stats</h3>
          <div className="space-y-4">
            <StatRow label="Possession" values={matchStats.possession} />
            <StatRow label="Shots" values={matchStats.shots} />
            <StatRow label="Shots on Target" values={matchStats.shotsOnTarget} />
            <StatRow label="Corners" values={matchStats.corners} />
            <StatRow label="Fouls" values={matchStats.fouls} />
          </div>
        </div>
      )}
      
      {/* Match events timeline */}
      {events && events.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-8 px-4">
          <h3 className="text-xl font-semibold mb-4 text-center">Match Events</h3>
          <div className="relative border-l-2 border-gray-700 ml-4 pl-4 space-y-4">
            {events.map((event, index) => (
              <EventItem key={index} event={event} homeTeam={homeTeam} awayTeam={awayTeam} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for statistics rows
const StatRow: React.FC<{ label: string; values: [number, number] }> = ({ label, values }) => {
  const [homeValue, awayValue] = values;
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>{homeValue}</span>
        <span className="text-gray-400">{label}</span>
        <span>{awayValue}</span>
      </div>
      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-l-full"
          style={{ width: `${homePercent}%` }}
        />
      </div>
    </div>
  );
};

// Helper component for timeline events
const EventItem: React.FC<{ 
  event: MatchSummaryProps['events'][0]; 
  homeTeam: string; 
  awayTeam: string; 
}> = ({ event, homeTeam, awayTeam }) => {
  const teamName = event.team === 'home' ? homeTeam : awayTeam;
  
  // Event icon based on type
  const getEventIcon = () => {
    switch (event.eventType) {
      case 'goal': return '⚽';
      case 'yellow': return '🟨';
      case 'red': return '🟥';
      case 'substitution': return '🔄';
      default: return '•';
    }
  };
  
  return (
    <div className="relative">
      <div className="absolute -left-10 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
        {getEventIcon()}
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3">
        <div className="text-sm font-medium">{event.time}' - {event.player}</div>
        <div className="text-xs text-gray-400">
          {event.eventType === 'goal' && event.assistBy && `Assisted by ${event.assistBy}`}
          {event.eventType === 'substitution' && 'Substitution'}
          {(event.eventType === 'yellow' || event.eventType === 'red') && 'Card'}
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;