import React from 'react';
import { Clock } from 'lucide-react';

interface MatchSummaryProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  matchVenue?: string;
  events?: Array<{
    time: string; // Basketball uses period and time (e.g., "1st 8:45")
    team: 'home' | 'away';
    player: string;
    eventType: 'field_goal' | 'three_pointer' | 'free_throw' | 'rebound' | 'assist' | 'steal' | 'block' | 'turnover' | 'foul' | 'substitution';
    assistBy?: string;
    inPlayer?: string;
    outPlayer?: string;
    score?: string;
  }>;
}

// Enhanced Timeline Event Component - Fully Responsive
const TimelineEvent: React.FC<{
  event: any;
  homeTeam: string;
  awayTeam: string;
}> = ({ event, homeTeam, awayTeam }) => {
  const isHomeTeam = event.team === 'home';
  
  const getEventIcon = () => {
    const mobileSize = 'w-6 h-6 sm:w-8 sm:h-8';
    const cardSize = 'w-4 h-6 sm:w-6 sm:h-8';
    
    switch (event.eventType) {
      case 'field_goal':
        return <div className={`${mobileSize} bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">🏀</span>
        </div>;
      case 'three_pointer':
        return <div className={`${mobileSize} bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">3️⃣</span>
        </div>;
      case 'free_throw':
        return <div className={`${mobileSize} bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">FT</span>
        </div>;
      case 'rebound':
        return <div className={`${mobileSize} bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">🔄</span>
        </div>;
      case 'assist':
        return <div className={`${mobileSize} bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">🤝</span>
        </div>;
      case 'steal':
        return <div className={`${mobileSize} bg-teal-500 dark:bg-teal-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">🧤</span>
        </div>;
      case 'block':
        return <div className={`${mobileSize} bg-indigo-500 dark:bg-indigo-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">🛡️</span>
        </div>;
      case 'turnover':
        return <div className={`${mobileSize} bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold"> turnovers</span>
        </div>;
      case 'foul':
        return <div className={`${cardSize} bg-yellow-400 dark:bg-yellow-500 border-2 border-yellow-500 dark:border-yellow-600 rounded-sm shadow-sm`} />;
      case 'substitution':
        return <div className={`${mobileSize} bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="text-white text-xs font-bold">↔️</span>
        </div>;
      default:
        return <div className={`${mobileSize} bg-slate-400 dark:bg-slate-500 rounded-full shadow-lg`} />;
    }
  };
  
  return (
    <div className={`flex items-center ${isHomeTeam ? '' : 'flex-row-reverse'} py-2 sm:py-3 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors px-1 sm:px-0`}>
      <div className={`flex items-center space-x-2 sm:space-x-4 w-full ${isHomeTeam ? '' : 'flex-row-reverse space-x-reverse'}`}>
        {/* Time badge - Fully responsive */}
        <div className="flex-shrink-0">
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
            {event.time}
          </span>
        </div>
        
        {/* Event icon - Fully responsive */}
        <div className="flex-shrink-0">
          {getEventIcon()}
        </div>
        
        {/* Event details - Fully responsive */}
        <div className={`${isHomeTeam ? 'text-left' : 'text-right'} min-w-0 flex-1`}>
          <div className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100">
            {event.eventType === 'substitution' ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                  <span className="text-red-600 dark:text-red-400">↓</span>
                  <span className="truncate">{event.outPlayer || event.player}</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                  <span className="text-green-600 dark:text-green-400">↑</span>
                  <span className="truncate">{event.inPlayer}</span>
                </div>
              </div>
            ) : (
              <span className="truncate block">{event.player}</span>
            )}
          </div>
          
          {event.assistBy && (event.eventType === 'field_goal' || event.eventType === 'three_pointer') && (
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Assist: <span className="font-medium">{event.assistBy}</span>
            </div>
          )}
          
          {event.score && (
            <div className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 mt-1 bg-green-50 dark:bg-green-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block">
              {event.score}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BasketballSummaryScreen: React.FC<MatchSummaryProps> = ({
  homeTeam = "Phoenix",
  awayTeam = "Blazers",
  homeScore,
  awayScore,
  matchDate,
  matchVenue,
  events
}) => {
  // Sample basketball events if none provided
  const displayEvents = events && events.length > 0 ? [...events].sort((a, b) => {
    // Simple sort by time for basketball events
    return a.time.localeCompare(b.time);
  }) : [
    { time: "1st 8:45", team: 'home', player: 'Johnson', eventType: 'field_goal', assistBy: 'Williams', score: '2-0' },
    { time: "1st 7:21", team: 'away', player: 'Davis', eventType: 'three_pointer', assistBy: 'Brown', score: '2-3' },
    { time: "1st 5:33", team: 'home', player: 'Miller', eventType: 'free_throw', score: '3-3' },
    { time: "1st 5:33", team: 'home', player: 'Miller', eventType: 'free_throw', score: '4-3' },
    { time: "1st 2:15", team: 'away', player: 'Wilson', eventType: 'rebound' },
    { time: "2nd 9:12", team: 'home', player: 'Johnson', eventType: 'assist' },
    { time: "2nd 7:45", team: 'away', player: 'Davis', eventType: 'steal' },
    { time: "2nd 6:33", team: 'home', player: 'Williams', eventType: 'turnover' },
    { time: "2nd 4:21", team: 'away', player: 'Brown', eventType: 'block' },
    { time: "2nd 3:15", team: 'home', player: 'Miller', eventType: 'foul' },
    { time: "2nd 3:15", team: 'away', player: 'Davis', eventType: 'substitution', inPlayer: 'Taylor', outPlayer: 'Davis' }
  ];

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 w-full">
        <div className="p-3 sm:p-4 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-700 rounded-t-lg">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center text-sm sm:text-base">
            <Clock size={16} className="sm:size-18 mr-2 text-blue-600 dark:text-blue-400" />
            Match Events
          </h3>
        </div>
        <div className="p-3 sm:p-6">
          {displayEvents.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-slate-500 dark:text-slate-400">
              <Clock size={36} className="sm:size-48 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm sm:text-base">No events to display</p>
              <p className="text-xs sm:text-sm">Match events will appear here as they happen</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-4">
              {displayEvents.map((event, index) => (
                <TimelineEvent key={index} event={event} homeTeam={homeTeam} awayTeam={awayTeam} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasketballSummaryScreen;