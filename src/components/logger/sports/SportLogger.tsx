import React from 'react';
import { SportType, Team, CampusEventType } from '../../../types/campus';
import FootballLogger from './FootballLogger';
import { BasketballLogger } from './BasketballLogger';
import { TrackFieldLogger } from './TrackFieldLogger';

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
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Sport logger not implemented for {sportType}
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderSportLogger()}
    </div>
  );
};