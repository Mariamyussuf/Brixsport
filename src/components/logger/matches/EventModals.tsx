import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  GoalForm, 
  CardForm, 
  SubstitutionForm, 
  FoulForm, 
  InjuryForm, 
  VARForm, 
  PenaltyForm 
} from './EventForms';

interface EventModalsProps {
  isOpen: boolean;
  onClose: () => void;
  eventType: string | null;
  onSubmit: (data: any) => void;
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
}

export const EventModals: React.FC<EventModalsProps> = ({ 
  isOpen, 
  onClose, 
  eventType, 
  onSubmit, 
  players, 
  teamId 
}) => {
  const [formData, setFormData] = useState<any>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };
  
  const renderForm = () => {
    switch (eventType) {
      case 'goal':
        return <GoalForm 
          players={players}
          teamId={teamId}
          onChange={(data) => setFormData(data)} 
        />;
      case 'card':
        return <CardForm 
          players={players}
          teamId={teamId}
          onChange={(data) => setFormData(data)} 
        />;
      case 'substitution':
        return <SubstitutionForm 
          players={players}
          teamId={teamId}
          onChange={(data) => setFormData(data)} 
        />;
      case 'foul':
        return <FoulForm 
          players={players}
          teamId={teamId}
          onChange={(data) => setFormData(data)} 
        />;
      case 'injury':
        return <InjuryForm 
          players={players}
          teamId={teamId}
          onChange={(data) => setFormData(data)} 
        />;
      case 'VAR':
        return <VARForm 
          onChange={(data) => setFormData(data)} 
        />;
      case 'penalty':
        return <PenaltyForm 
          onChange={(data) => setFormData(data)} 
        />;
      default:
        return null;
    }
  };
  
  if (!eventType) return null;
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log {eventType} Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm()}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Log Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};