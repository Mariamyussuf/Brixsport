import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/config/api';

interface BaseEvent {
  time: number;
  team: 'home' | 'away';
  player: string;
}

interface GoalEvent extends BaseEvent {
  eventType: 'goal';
  assistBy?: string;
  score?: string;
}

interface CardEvent extends BaseEvent {
  eventType: 'yellow' | 'red';
}

interface SubstitutionEvent extends BaseEvent {
  eventType: 'substitution';
  inPlayer?: string;
  outPlayer?: string;
}

interface MarkerEvent {
  time: number;
  team: 'home' | 'away';
  player: string;
  eventType: 'half-time' | 'full-time';
}

type MatchEvent = GoalEvent | CardEvent | SubstitutionEvent | MarkerEvent;

interface MatchSummaryProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  matchVenue?: string;
  events?: MatchEvent[];
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
  matchId,
  homeTeam = "Arsenal",
  awayTeam = "Manchester United",
  homeScore,
  awayScore,
  matchDate,
  matchVenue,
  events
}) => {
  const [displayEvents, setDisplayEvents] = useState<MatchEvent[]>(() => {
    // Sample events if none provided
    const initialEvents: MatchEvent[] = events && events.length > 0 ? [...events].sort((a, b) => a.time - b.time) : [
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
    return initialEvents;
  });

  // Real-time event updates using WebSocket
  useEffect(() => {
    if (!matchId) return;

    // Connect to WebSocket server
    const socket = io(SOCKET_URL);
    
    // Join match room
    socket.emit('joinMatch', { matchId });
    
    // Listen for new events
    socket.on('match:event', (newEvent: any) => {
      setDisplayEvents(prev => {
        // Check if event already exists to prevent duplicates
        const exists = prev.some(event => 
          event.time === newEvent.minute && 
          event.player === newEvent.player_name &&
          event.eventType === newEvent.event_type
        );
        
        if (!exists) {
          // Determine event type
          const eventType = newEvent.event_type.replace('_', '') as 'goal' | 'yellow' | 'red' | 'substitution';
          
          // Create properly typed event object based on event type
          let transformedEvent: MatchEvent;
          
          if (eventType === 'goal') {
            transformedEvent = {
              time: newEvent.minute,
              team: newEvent.team_name === homeTeam ? 'home' : 'away',
              player: newEvent.player_name || '',
              eventType: 'goal',
              assistBy: newEvent.assist_by || undefined,
              score: newEvent.score || undefined
            };
          } else if (eventType === 'substitution') {
            transformedEvent = {
              time: newEvent.minute,
              team: newEvent.team_name === homeTeam ? 'home' : 'away',
              player: newEvent.player_name || '',
              eventType: 'substitution',
              inPlayer: newEvent.in_player || undefined,
              outPlayer: newEvent.out_player || undefined
            };
          } else if (eventType === 'yellow' || eventType === 'red') {
            transformedEvent = {
              time: newEvent.minute,
              team: newEvent.team_name === homeTeam ? 'home' : 'away',
              player: newEvent.player_name || '',
              eventType: eventType
            };
          } else {
            // Fallback for any other event types
            transformedEvent = {
              time: newEvent.minute,
              team: newEvent.team_name === homeTeam ? 'home' : 'away',
              player: newEvent.player_name || '',
              eventType: eventType
            } as MatchEvent;
          }
          
          // Add new event and sort by time
          const updatedEvents = [...prev, transformedEvent];
          return updatedEvents.sort((a, b) => a.time - b.time);
        }
        
        return prev;
      });
    });
    
    // Cleanup function
    return () => {
      socket.emit('leaveMatch', { matchId });
      socket.disconnect();
    };
  }, [matchId, homeTeam]);

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