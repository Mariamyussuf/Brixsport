import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  GoalIcon, 
  CardIcon, 
  SubstitutionIcon, 
  FoulIcon, 
  InjuryIcon, 
  VARIcon, 
  PenaltyIcon 
} from './EventIcons';

interface MatchEventButtonsProps {
  onEventClick: (eventType: string) => void;
  disabled: boolean;
  matchStatus: 'scheduled' | 'live' | 'half-time' | 'full-time' | 'postponed';
}

export const MatchEventButtons: React.FC<MatchEventButtonsProps> = ({ 
  onEventClick, 
  disabled,
  matchStatus
}) => {
  // Determine which events are allowed based on match status
  const isEventAllowed = (eventType: string): boolean => {
    switch (matchStatus) {
      case 'scheduled':
        return eventType === 'kick-off';
      case 'live':
        return eventType !== 'kick-off' && eventType !== 'full-time';
      case 'half-time':
        return eventType === 'kick-off'; // For second half start
      case 'full-time':
      case 'postponed':
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="match-event-buttons flex flex-wrap gap-2 p-4 bg-gray-100 rounded-lg">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('goal')}
        disabled={disabled || !isEventAllowed('goal')}
        aria-label="Goal"
        className="relative"
      >
        <GoalIcon />
        {!isEventAllowed('goal') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('card')}
        disabled={disabled || !isEventAllowed('card')}
        aria-label="Card"
        className="relative"
      >
        <CardIcon />
        {!isEventAllowed('card') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('substitution')}
        disabled={disabled || !isEventAllowed('substitution')}
        aria-label="Substitution"
        className="relative"
      >
        <SubstitutionIcon />
        {!isEventAllowed('substitution') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('foul')}
        disabled={disabled || !isEventAllowed('foul')}
        aria-label="Foul"
        className="relative"
      >
        <FoulIcon />
        {!isEventAllowed('foul') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('injury')}
        disabled={disabled || !isEventAllowed('injury')}
        aria-label="Injury"
        className="relative"
      >
        <InjuryIcon />
        {!isEventAllowed('injury') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('VAR')}
        disabled={disabled || !isEventAllowed('VAR')}
        aria-label="VAR"
        className="relative"
      >
        <VARIcon />
        {!isEventAllowed('VAR') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('penalty')}
        disabled={disabled || !isEventAllowed('penalty')}
        aria-label="Penalty"
        className="relative"
      >
        <PenaltyIcon />
        {!isEventAllowed('penalty') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('kick-off')}
        disabled={disabled || !isEventAllowed('kick-off')}
        aria-label="Kick-off"
        className="relative"
      >
        ▶️
        {!isEventAllowed('kick-off') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('half-time')}
        disabled={disabled || !isEventAllowed('half-time')}
        aria-label="Half-time"
        className="relative"
      >
        ⏸️
        {!isEventAllowed('half-time') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onEventClick('full-time')}
        disabled={disabled || !isEventAllowed('full-time')}
        aria-label="Full-time"
        className="relative"
      >
        🏁
        {!isEventAllowed('full-time') && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md"></div>}
      </Button>
    </div>
  );
};