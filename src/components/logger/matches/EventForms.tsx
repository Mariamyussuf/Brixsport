import React, { useEffect, useState } from 'react';

// Types
export interface GoalFormData {
  playerId: string;
  secondaryPlayerId?: string;
  minute: number;
  second: number;
  millisecond: number;
  goalType: string;
}

export interface CardFormData {
  playerId: string;
  minute: number;
  second: number;
  millisecond: number;
  cardType: 'yellow' | 'red';
}

export interface SubstitutionFormData {
  playerId: string;
  secondaryPlayerId: string;
  minute: number;
  second: number;
  millisecond: number;
}

export interface FoulFormData {
  playerId: string;
  secondaryPlayerId?: string;
  minute: number;
  second: number;
  millisecond: number;
  foulType: string;
}

export interface InjuryFormData {
  playerId: string;
  minute: number;
  second: number;
  millisecond: number;
  injurySeverity: string;
}

export interface VARFormData {
  minute: number;
  second: number;
  millisecond: number;
  VARDecision: string;
}

export interface PenaltyFormData {
  minute: number;
  second: number;
  millisecond: number;
  penaltyType: string;
}

// Common components
interface PlayerSelectProps {
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({ 
  players, 
  teamId, 
  value, 
  onChange, 
  label,
  required = true
}) => {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label} {required && <span className="text-red-500">*</span>}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded-md"
        required={required}
      >
        <option value="">Select player</option>
        {players[teamId]?.map((player) => (
          <option key={player.id} value={player.id}>
            #{player.jerseyNumber} {player.name}
          </option>
        ))}
      </select>
    </div>
  );
};

interface TimeInputProps {
  value: { minute: number; second: number; millisecond: number };
  onChange: (time: { minute: number; second: number; millisecond: number }) => void;
  label: string;
  required?: boolean;
  minTime?: { minute: number; second: number; millisecond: number };
  maxTime?: { minute: number; second: number; millisecond: number };
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  value, 
  onChange, 
  label,
  required = true,
  minTime,
  maxTime
}) => {
  // Validate time input
  const validateAndSetTime = (field: 'minute' | 'second' | 'millisecond', val: number) => {
    let newValue = val;
    
    // Apply constraints
    if (field === 'minute') {
      newValue = Math.max(0, Math.min(120, val)); // Max 120 minutes for extra time
    } else if (field === 'second') {
      newValue = Math.max(0, Math.min(59, val));
    } else if (field === 'millisecond') {
      newValue = Math.max(0, Math.min(999, val));
    }
    
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="flex space-x-2 items-center">
        <input 
          type="number"
          value={value.minute}
          onChange={(e) => validateAndSetTime('minute', parseInt(e.target.value) || 0)}
          className="w-16 p-2 border rounded-md"
          placeholder="Min"
          min="0"
          max="120"
          required={required}
        />
        <span className="flex items-center">:</span>
        <input 
          type="number"
          value={value.second}
          onChange={(e) => validateAndSetTime('second', parseInt(e.target.value) || 0)}
          className="w-16 p-2 border rounded-md"
          placeholder="Sec"
          min="0"
          max="59"
          required={required}
        />
        <span className="flex items-center">.</span>
        <input 
          type="number"
          value={value.millisecond}
          onChange={(e) => validateAndSetTime('millisecond', parseInt(e.target.value) || 0)}
          className="w-20 p-2 border rounded-md"
          placeholder="Milliseconds"
          min="0"
          max="999"
          required={required}
        />
      </div>
      <div className="text-xs text-gray-500">
        Format: MM:SS.mmm
      </div>
    </div>
  );
};

// Event forms
interface GoalFormProps {
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
  onChange: (data: GoalFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const GoalForm: React.FC<GoalFormProps> = ({ 
  players, 
  teamId, 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<GoalFormData>({
    playerId: '',
    secondaryPlayerId: '',
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond,
    goalType: 'regular'
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  const goalTypes = [
    { value: 'regular', label: 'Regular Goal' },
    { value: 'penalty', label: 'Penalty' },
    { value: 'free-kick', label: 'Free Kick' },
    { value: 'header', label: 'Header' },
    { value: 'own-goal', label: 'Own Goal' }
  ];
  
  return (
    <div className="space-y-4">
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.playerId} 
        onChange={(value) => setFormData({ ...formData, playerId: value })} 
        label="Scoring Player"
        required={true}
      />
      
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.secondaryPlayerId || ''} 
        onChange={(value) => setFormData({ ...formData, secondaryPlayerId: value })} 
        label="Assisting Player (optional)"
        required={false}
      />
      
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Goal Type</label>
        <select 
          value={formData.goalType} 
          onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          {goalTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

interface CardFormProps {
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
  onChange: (data: CardFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const CardForm: React.FC<CardFormProps> = ({ 
  players, 
  teamId, 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<CardFormData>({
    playerId: '',
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond,
    cardType: 'yellow'
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  return (
    <div className="space-y-4">
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.playerId} 
        onChange={(value) => setFormData({ ...formData, playerId: value })} 
        label="Player"
        required={true}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Card Type <span className="text-red-500">*</span></label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input 
              type="radio" 
              value="yellow" 
              checked={formData.cardType === 'yellow'}
              onChange={() => setFormData({ ...formData, cardType: 'yellow' })}
            />
            <span>Yellow Card 🟨</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="radio" 
              value="red" 
              checked={formData.cardType === 'red'}
              onChange={() => setFormData({ ...formData, cardType: 'red' })}
            />
            <span>Red Card 🟥</span>
          </label>
        </div>
      </div>
      
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
    </div>
  );
};

interface SubstitutionFormProps {
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
  onChange: (data: SubstitutionFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const SubstitutionForm: React.FC<SubstitutionFormProps> = ({ 
  players, 
  teamId, 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<SubstitutionFormData>({
    playerId: '',
    secondaryPlayerId: '',
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  return (
    <div className="space-y-4">
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.playerId} 
        onChange={(value) => setFormData({ ...formData, playerId: value })} 
        label="Player Out"
        required={true}
      />
      
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.secondaryPlayerId || ''} 
        onChange={(value) => setFormData({ ...formData, secondaryPlayerId: value })} 
        label="Player In"
        required={true}
      />
      
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
    </div>
  );
};

interface FoulFormProps {
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
  onChange: (data: FoulFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const FoulForm: React.FC<FoulFormProps> = ({ 
  players, 
  teamId, 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<FoulFormData>({
    playerId: '',
    secondaryPlayerId: '',
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond,
    foulType: 'tackle'
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  const foulTypes = [
    { value: 'tackle', label: 'Tackle' },
    { value: 'handball', label: 'Handball' },
    { value: 'offside', label: 'Offside' },
    { value: 'foul-play', label: 'Foul Play' },
    { value: 'dissent', label: 'Dissent' },
    { value: 'time-wasting', label: 'Time Wasting' },
    { value: 'unsporting', label: 'Unsporting Behavior' }
  ];
  
  return (
    <div className="space-y-4">
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.playerId} 
        onChange={(value) => setFormData({ ...formData, playerId: value })} 
        label="Player Committing Foul"
        required={true}
      />
      
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.secondaryPlayerId || ''} 
        onChange={(value) => setFormData({ ...formData, secondaryPlayerId: value })} 
        label="Player Fouled (optional)"
        required={false}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Foul Type</label>
        <select 
          value={formData.foulType} 
          onChange={(e) => setFormData({ ...formData, foulType: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          {foulTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
    </div>
  );
};

interface InjuryFormProps {
  players: Record<string, { id: string; name: string; jerseyNumber: number; }[]>;
  teamId: string;
  onChange: (data: InjuryFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const InjuryForm: React.FC<InjuryFormProps> = ({ 
  players, 
  teamId, 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<InjuryFormData>({
    playerId: '',
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond,
    injurySeverity: 'minor'
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  const injurySeverities = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' }
  ];
  
  return (
    <div className="space-y-4">
      <PlayerSelect 
        players={players} 
        teamId={teamId} 
        value={formData.playerId} 
        onChange={(value) => setFormData({ ...formData, playerId: value })} 
        label="Injured Player"
        required={true}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Injury Severity</label>
        <select 
          value={formData.injurySeverity} 
          onChange={(e) => setFormData({ ...formData, injurySeverity: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          {injurySeverities.map((severity) => (
            <option key={severity.value} value={severity.value}>
              {severity.label}
            </option>
          ))}
        </select>
      </div>
      
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
    </div>
  );
};

interface VARFormProps {
  onChange: (data: VARFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const VARForm: React.FC<VARFormProps> = ({ 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<VARFormData>({
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond,
    VARDecision: ''
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  return (
    <div className="space-y-4">
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium">VAR Decision</label>
        <input 
          type="text" 
          value={formData.VARDecision}
          onChange={(e) => setFormData({ ...formData, VARDecision: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="Enter VAR decision"
        />
      </div>
    </div>
  );
};

interface PenaltyFormProps {
  onChange: (data: PenaltyFormData) => void;
  initialTime?: { minute: number; second: number; millisecond: number };
}

export const PenaltyForm: React.FC<PenaltyFormProps> = ({ 
  onChange,
  initialTime = { minute: 0, second: 0, millisecond: 0 }
}) => {
  const [formData, setFormData] = React.useState<PenaltyFormData>({
    minute: initialTime.minute,
    second: initialTime.second,
    millisecond: initialTime.millisecond,
    penaltyType: 'regular'
  });
  
  React.useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);
  
  const penaltyTypes = [
    { value: 'regular', label: 'Regular Penalty' },
    { value: 'missed', label: 'Missed Penalty' },
    { value: 'saved', label: 'Saved Penalty' },
    { value: 'converted', label: 'Converted Penalty' }
  ];
  
  return (
    <div className="space-y-4">
      <TimeInput 
        value={{ 
          minute: formData.minute, 
          second: formData.second, 
          millisecond: formData.millisecond 
        }}
        onChange={(time) => setFormData({ 
          ...formData, 
          minute: time.minute, 
          second: time.second, 
          millisecond: time.millisecond 
        })}
        label="Time"
        required={true}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Penalty Type</label>
        <select 
          value={formData.penaltyType} 
          onChange={(e) => setFormData({ ...formData, penaltyType: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          {penaltyTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};