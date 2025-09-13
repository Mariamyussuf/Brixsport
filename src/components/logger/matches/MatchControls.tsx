import React from 'react';
import { Button } from '@/components/ui/button';
 import { 
  PlayIcon, 
  PauseIcon, 
  FlagIcon, 
  TimerIcon, 
  PlusIcon 
} from './MatchIcons';;

interface MatchControlsProps {
  matchStatus: string;
  onStartMatch: () => void;
  onEndMatch: () => void;
  onHalfTime: () => void;
  onAddMinute: () => void;
  disabled: boolean;
}

export const MatchControls: React.FC<MatchControlsProps> = ({ 
  matchStatus, 
  onStartMatch, 
  onEndMatch, 
  onHalfTime, 
  onAddMinute, 
  disabled 
}) => {
  const isMatchNotStarted = matchStatus === 'scheduled';
  const isMatchLive = matchStatus === 'live';
  const isMatchHalfTime = matchStatus === 'half-time';
  const isMatchCompleted = matchStatus === 'full-time';
  
  return (
    <div className="match-controls flex flex-wrap gap-2 p-4 bg-gray-100 rounded-lg">
      {isMatchNotStarted && (
        <Button 
          variant="default" 
          size="icon" 
          onClick={onStartMatch}
          disabled={disabled}
          aria-label="Start Match"
        >
          <PlayIcon />
        </Button>
      )}
      
      {isMatchLive && (
        <>
          <Button 
            variant="default" 
            size="icon" 
            onClick={onHalfTime}
            disabled={disabled}
            aria-label="Half-time"
          >
            <PauseIcon />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            onClick={onEndMatch}
            disabled={disabled}
            aria-label="End Match"
          >
            <FlagIcon />
          </Button>
        </>
      )}
      
      {(isMatchHalfTime || isMatchCompleted) && (
        <Button 
          variant="default" 
          size="icon" 
          onClick={onStartMatch}
          disabled={disabled}
          aria-label="Resume Match"
        >
          <PlayIcon />
        </Button>
      )}
      
      {(isMatchLive || isMatchHalfTime) && (
        <Button 
          variant="default" 
          size="icon" 
          onClick={onAddMinute}
          disabled={disabled}
          aria-label="Add Minute"
        >
          <TimerIcon />
          <PlusIcon />
        </Button>
      )}
      
      {/* Additional controls can be added here */}
    </div>
  );
};