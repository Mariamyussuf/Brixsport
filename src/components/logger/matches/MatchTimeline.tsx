import React from 'react';
import { MatchEvent } from '@/types/matchEvents';

interface MatchTimelineProps {
  events: MatchEvent[];
}

export const MatchTimeline: React.FC<MatchTimelineProps> = ({ events }) => {
  // Sort events by timestamp with millisecond precision
  const sortedEvents = [...events].sort((a, b) => {
    // First sort by minute, second, millisecond
    if (a.minute !== b.minute) return a.minute - b.minute;
    if (a.second !== b.second) return a.second - b.second;
    if (a.millisecond !== b.millisecond) return a.millisecond - b.millisecond;
    
    // If all time values are equal, sort by timestamp
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateA - dateB;
  });

  return (
    <div className="match-timeline">
      <h3 className="text-lg font-bold mb-4">Match Timeline</h3>
      <div className="timeline-events space-y-2 max-h-96 overflow-y-auto">
        {sortedEvents.map((event) => (
          <div 
            key={event.id} 
            className="timeline-event p-2 rounded-md hover:bg-gray-100 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center">
              <span className="event-icon mr-2 text-lg">
                {getEventEmoji(event.type)}
              </span>
              <span className="event-time font-mono text-sm mr-2 min-w-[70px]">
                {formatEventTime(event)}
              </span>
              <span className="event-description flex-1">
                {formatEventDescription(event)}
              </span>
            </div>
          </div>
        ))}
        {sortedEvents.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No events logged yet
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for formatting events
function getEventEmoji(type: string): string {
  switch (type) {
    case 'goal': return '⚽';
    case 'card': return '🟨'; // Default to yellow card
    case 'substitution': return '🔄';
    case 'foul': return '🛑';
    case 'injury': return '🚑';
    case 'VAR': return '📺';
    case 'penalty': return '🎯';
    case 'kick-off': return '▶️';
    case 'half-time': return '⏸️';
    case 'full-time': return '🏁';
    default: return 'ℹ️';
  }
}

function formatEventTime(event: MatchEvent): string {
  const minutes = Math.floor(event.minute);
  const seconds = Math.floor(event.second);
  const milliseconds = Math.floor(event.millisecond);
  
  // Format with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMilliseconds = milliseconds.toString().padStart(3, '0');
  
  return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}

function formatEventDescription(event: MatchEvent): string {
  switch (event.type) {
    case 'goal':
      let description = `Goal by Player ${event.playerId || 'Unknown'}`;
      if (event.secondaryPlayerId) {
        description += ` (Assist: Player ${event.secondaryPlayerId})`;
      }
      if (event.metadata.goalType) {
        description += ` - ${event.metadata.goalType}`;
      }
      return description;
    case 'card':
      const cardType = event.metadata.cardType || 'yellow';
      return `${cardType === 'yellow' ? 'Yellow' : 'Red'} card - Player ${event.playerId || 'Unknown'}`;
    case 'substitution':
      return `Substitution: Player ${event.secondaryPlayerId || 'Unknown'} in for Player ${event.playerId || 'Unknown'}`;
    case 'foul':
      let foulDesc = `Foul by Player ${event.playerId || 'Unknown'}`;
      if (event.secondaryPlayerId) {
        foulDesc += ` on Player ${event.secondaryPlayerId}`;
      }
      if (event.metadata.foulType) {
        foulDesc += ` - ${event.metadata.foulType}`;
      }
      return foulDesc;
    case 'injury':
      let injuryDesc = `Injury to Player ${event.playerId || 'Unknown'}`;
      if (event.metadata.injurySeverity) {
        injuryDesc += ` - ${event.metadata.injurySeverity}`;
      }
      return injuryDesc;
    case 'VAR':
      return `VAR Review${event.metadata.VARDecision ? ` - ${event.metadata.VARDecision}` : ''}`;
    case 'penalty':
      return `Penalty${event.metadata.penaltyType ? ` - ${event.metadata.penaltyType}` : ''}`;
    case 'kick-off':
      return 'Kick-off';
    case 'half-time':
      return 'Half-time';
    case 'full-time':
      return 'Full-time';
    default:
      return event.description || 'Other event';
  }
}