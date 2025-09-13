import React from 'react';
import { Button } from '@/components/ui/button';
import { Match, Team } from '@/types/matchEvents';

interface MatchSelectorProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onCreateNewMatch: () => void;
  disabled: boolean;
  teams: Record<string, Team>;
}

export const MatchSelector: React.FC<MatchSelectorProps> = ({ 
  matches, 
  selectedMatchId, 
  onSelectMatch, 
  onCreateNewMatch, 
  disabled,
  teams
}) => {
  return (
    <div className="match-selector p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Select Match</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCreateNewMatch}
          disabled={disabled}
        >
          + New Match
        </Button>
      </div>
      
      <div className="h-[300px] pr-4 overflow-y-auto">
        <div className="space-y-2">
          {matches.map((match) => (
            <Button 
              key={match.id}
              variant={selectedMatchId === match.id ? "secondary" : "ghost"}
              className={`w-full justify-start p-2 text-left ${selectedMatchId === match.id ? 'bg-blue-100' : ''}`}
              onClick={() => !disabled && onSelectMatch(match.id)}
              disabled={disabled}
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                {teams[match.homeTeamId]?.name || 'Home Team'} vs {teams[match.awayTeamId]?.name || 'Away Team'}
              </div>
                  <span className="text-xs text-gray-500">
                    {new Date(match.dateTime).toLocaleDateString()} • {match.venue || 'Unknown Venue'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{match.status}</span>
                  <span className="text-sm">
                    {new Date(match.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </Button>
          ))}
          
          {matches.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No matches found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};