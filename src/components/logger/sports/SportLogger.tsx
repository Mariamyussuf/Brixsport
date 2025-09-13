import React from 'react';
import { SportType, Team, CampusEventType } from '../../../types/campus';
import { FootballLogger } from './FootballLogger';
import { BasketballLogger } from './BasketballLogger';
import { VolleyballLogger } from './VolleyballLogger';
import { TrackFieldLogger } from './TrackFieldLogger';
import { TableTennisLogger } from './TableTennisLogger';
import { BadmintonLogger } from './BadmintonLogger';

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
        return (
          <FootballLogger
            teams={teams}
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
      case 'volleyball':
        return (
          <VolleyballLogger
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