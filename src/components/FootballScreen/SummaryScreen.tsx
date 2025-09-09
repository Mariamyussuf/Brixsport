import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface MatchSummaryProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  matchVenue?: string;
  events?: Array<{
    time: number;
    team: 'home' | 'away';
    player: string;
    eventType: 'goal' | 'yellow' | 'red' | 'substitution';
    assistBy?: string;
    inPlayer?: string;
    outPlayer?: string;
    score?: string;
  }>;
}

// Event Icon Component
const EventIcon: React.FC<{ eventType: string }> = ({ eventType }) => {
  const iconClass = "w-5 h-5 flex items-center justify-center";
  
  switch (eventType) {
    case 'goal':
      return (
        <div className={`${iconClass} text-green-500`}>
          <span className="font-bold">⚽</span>
        </div>
      );
    case 'yellow':
      return (
        <div className={`${iconClass}`}>
          <div className="w-4 h-6 bg-yellow-500 rounded-sm"></div>
        </div>
      );
    case 'red':
      return (
        <div className={`${iconClass}`}>
          <div className="w-4 h-6 bg-red-500 rounded-sm"></div>
        </div>
      );
    case 'substitution':
      return (
        <div className={`${iconClass} text-blue-500`}>
          <span className="font-bold">↔️</span>
        </div>
      );
    default:
      return (
        <div className={`${iconClass} text-gray-400`}>
          <span className="font-bold">•</span>
        </div>
      );
  }
};

// Event Item Component
const EventItem: React.FC<{
  event: any;
  homeTeam: string;
  awayTeam: string;
}> = ({ event, homeTeam, awayTeam }) => {
  const isHomeTeam = event.team === 'home';
  
  // Special handling for half-time and full-time markers
  if (event.eventType === 'half-time' || event.eventType === 'full-time') {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {event.eventType === 'half-time' ? 'HT' : 'FT'}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center py-2">
      {/* Time */}
      <div className="w-10 text-center">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {event.time}'
        </span>
      </div>
      
      {/* Event content - home team */}
      <div className="flex-1 min-w-0">
        {isHomeTeam && (
          <div className="flex items-center">
            <EventIcon eventType={event.eventType} />
            <div className="ml-2 min-w-0">
              {event.eventType === 'goal' && (
                <div>
                  <div className="font-bold text-sm truncate">{event.player}</div>
                  {event.assistBy && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Assist: {event.assistBy}
                    </div>
                  )}
                </div>
              )}
              
              {(event.eventType === 'yellow' || event.eventType === 'red') && (
                <div className="font-bold text-sm truncate">{event.player}</div>
              )}
              
              {event.eventType === 'substitution' && (
                <div>
                  <div className="flex items-center text-red-500">
                    <span className="text-xs mr-1">↓</span>
                    <span className="font-bold text-sm truncate">{event.outPlayer || event.player}</span>
                  </div>
                  <div className="flex items-center text-green-500">
                    <span className="text-xs mr-1">↑</span>
                    <span className="font-bold text-sm truncate">{event.inPlayer}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Event content - away team */}
      <div className="flex-1 min-w-0 text-right">
        {!isHomeTeam && (
          <div className="flex items-center justify-end">
            <div className="mr-2 min-w-0 text-right">
              {event.eventType === 'goal' && (
                <div>
                  <div className="font-bold text-sm truncate">{event.player}</div>
                  {event.assistBy && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Assist: {event.assistBy}
                    </div>
                  )}
                </div>
              )}
              
              {(event.eventType === 'yellow' || event.eventType === 'red') && (
                <div className="font-bold text-sm truncate">{event.player}</div>
              )}
              
              {event.eventType === 'substitution' && (
                <div>
                  <div className="flex items-center justify-end text-red-500">
                    <span className="font-bold text-sm truncate">{event.outPlayer || event.player}</span>
                    <span className="text-xs ml-1">↓</span>
                  </div>
                  <div className="flex items-center justify-end text-green-500">
                    <span className="font-bold text-sm truncate">{event.inPlayer}</span>
                    <span className="text-xs ml-1">↑</span>
                  </div>
                </div>
              )}
            </div>
            <EventIcon eventType={event.eventType} />
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryScreen: React.FC<MatchSummaryProps> = ({
  homeTeam = "Arsenal",
  awayTeam = "Manchester United",
  homeScore,
  awayScore,
  matchDate,
  matchVenue,
  events
}) => {
  // Sample events if none provided
  const displayEvents = events && events.length > 0 ? [...events].sort((a, b) => a.time - b.time) : [
    { time: 21, team: 'home', player: 'Calafiori', eventType: 'yellow' },
    { time: 33, team: 'away', player: 'McTominay', eventType: 'yellow' },
    { time: 45, team: 'home', player: '', eventType: 'half-time' },
    { time: 59, team: 'home', player: 'Saka', eventType: 'goal', assistBy: 'Ødegaard', score: '1-0' },
    { time: 71, team: 'away', player: 'Rashford', eventType: 'goal', score: '1-1' },
    { time: 72, team: 'away', player: 'Antony', eventType: 'substitution', inPlayer: 'Garnacho', outPlayer: 'Antony' },
    { time: 85, team: 'home', player: 'Jesus', eventType: 'goal', assistBy: 'Martinelli', score: '2-1' },
    { time: 90, team: 'away', player: 'Bruno Fernandes', eventType: 'goal', score: '2-2' },
    { time: 90, team: 'away', player: '', eventType: 'full-time' }
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div className="p-4">
        {displayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">No events to display</p>
            <p className="text-xs">Match events will appear here as they happen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayEvents.map((event, index) => (
              <EventItem 
                key={index} 
                event={event} 
                homeTeam={homeTeam} 
                awayTeam={awayTeam} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryScreen;