import React from 'react';
import { SportType, Team, CampusEventType } from '../../../types/campus';
import FootballLogger from './FootballLogger';
import { BasketballLogger } from './BasketballLogger';
import { TrackFieldLogger } from './TrackFieldLogger';
import { VolleyballLogger } from './VolleyballLogger';
import { TableTennisLogger } from './TableTennisLogger';
import { BadmintonLogger } from './BadmintonLogger';

// Universal logger that can handle all sport types
const UniversalLogger: React.FC<Omit<SportLoggerProps, 'sportType'>> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Universal Sport Logger</h3>
      <p className="text-gray-600 mb-4">This logger can be used for any sport type.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Team</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => {
                // Handle team selection
              }}
              disabled={disabled}
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              onChange={(e) => {
                // Handle event type selection
              }}
              disabled={disabled}
            >
              <option value="">Select event type</option>
              <option value="goal">Goal/Point</option>
              <option value="foul">Foul</option>
              <option value="substitution">Substitution</option>
              <option value="injury">Injury</option>
              <option value="time_event">Time Event</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player (Optional)</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={disabled}
            >
              <option value="">Select player (optional)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value/Description</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter value or description"
              disabled={disabled}
            />
          </div>
          
          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={disabled}
            onClick={() => {
              // Handle event submission
              onEventSubmit({
                eventType: 'goal', // Default event type
                timestamp: Date.now()
              });
            }}
          >
            Log Event
          </button>
        </div>
      </div>
    </div>
  );
};

interface SportLoggerProps {
  sportType: SportType;
  teams: Team[];
  onEventSubmit: (event: {
    teamId?: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
    value?: string | number;
  }) => void;
  disabled?: boolean;
}

export const SportLogger: React.FC<SportLoggerProps> = ({
  sportType,
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const renderSportLogger = () => {
    switch (sportType) {
      case 'football':
        // FootballLogger doesn't actually use the teams prop, so we pass an empty array
        return (
          <FootballLogger
            teams={[]}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
      case 'basketball':
        return (
          <BasketballLogger
            teams={teams}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
      case 'track_events':
        return (
          <TrackFieldLogger
            teams={teams}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
      case 'volleyball':
        return (
          <VolleyballLogger
            teams={teams}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
      case 'table_tennis':
        return (
          <TableTennisLogger
            teams={teams}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
      case 'badminton':
        return (
          <BadmintonLogger
            teams={teams}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
      case 'all':
      default:
        return (
          <UniversalLogger
            teams={teams}
            onEventSubmit={onEventSubmit}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="w-full">
      {renderSportLogger()}
    </div>
  );
};