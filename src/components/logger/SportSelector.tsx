import React from 'react';


const campusDesign = {
  interactive: 'min-h-[40px] min-w-[120px] cursor-pointer',
  colors: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  },
  layout: 'rounded-2xl shadow-lg p-4 gap-4',
  animations: 'transition-all duration-200 ease-in-out',
  focus: 'focus:ring-2 focus:ring-blue-500 focus:outline-none',
  responsive: {
    mobile: 'sm:',
    tablet: 'md:',
    desktop: 'lg:',
  },
};

export type SportType =
  | 'football'
  | 'basketball'
  | 'volleyball'
  | 'track_field'
  | 'table_tennis'
  | 'badminton';

interface SportSelectorProps {
  sportType: SportType | null;
  onSelect: (sport: SportType) => void;
  disabled?: boolean;
}

const SPORT_OPTIONS: { type: SportType; label: string; icon: React.ReactNode }[] = [
  { type: 'football', label: 'Football', icon: <span aria-hidden>⚽</span> },
  { type: 'basketball', label: 'Basketball', icon: <span aria-hidden>🏀</span> },
  { type: 'volleyball', label: 'Volleyball', icon: <span aria-hidden>🏐</span> },
  { type: 'track_field', label: 'Track & Field', icon: <span aria-hidden>🏃‍♂️</span> },
  { type: 'table_tennis', label: 'Table Tennis', icon: <span aria-hidden>🏓</span> },
  { type: 'badminton', label: 'Badminton', icon: <span aria-hidden>🏸</span> },
];

export const SportSelector: React.FC<SportSelectorProps> = ({ sportType, onSelect, disabled }) => {
  return (
    <div
      className={`w-full flex flex-wrap justify-center gap-4 ${campusDesign.layout}`}
      role="radiogroup"
      aria-label="Select sport type"
    >
      {SPORT_OPTIONS.map((sport) => (
        <button
          key={sport.type}
          type="button"
          className={`flex flex-col items-center justify-center ${campusDesign.interactive} ${campusDesign.animations} ${campusDesign.focus} px-4 py-2 text-lg font-semibold rounded-xl shadow-md
            ${sportType === sport.type ? campusDesign.colors.primary : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-100'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-checked={sportType === sport.type}
          aria-label={sport.label}
          role="radio"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onSelect(sport.type)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              onSelect(sport.type);
            }
          }}
          disabled={disabled}
        >
          <span className="text-3xl mb-1" aria-hidden>{sport.icon}</span>
          <span>{sport.label}</span>
        </button>
      ))}
    </div>
  );
}; 