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
  isLoading?: boolean;
}

const SPORT_OPTIONS: { 
  type: SportType; 
  label: string; 
  icon: React.ReactNode;
  description: string;
  category: 'team' | 'individual' | 'racket';
}[] = [
  { 
    type: 'football', 
    label: 'Football', 
    icon: <span aria-hidden>⚽</span>,
    description: 'Team sport played between two teams of eleven players',
    category: 'team'
  },
  { 
    type: 'basketball', 
    label: 'Basketball', 
    icon: <span aria-hidden>🏀</span>,
    description: 'Fast-paced team sport with two teams of five players',
    category: 'team'
  },
  { 
    type: 'volleyball', 
    label: 'Volleyball', 
    icon: <span aria-hidden>🏐</span>,
    description: 'Team sport where two teams hit a ball over a net',
    category: 'team'
  },
  { 
    type: 'track_field', 
    label: 'Track & Field', 
    icon: <span aria-hidden>🏃‍♂️</span>,
    description: 'Athletic sports including running, jumping, and throwing',
    category: 'individual'
  },
  { 
    type: 'table_tennis', 
    label: 'Table Tennis', 
    icon: <span aria-hidden>🏓</span>,
    description: 'Fast-paced racket sport played on a table',
    category: 'racket'
  },
  { 
    type: 'badminton', 
    label: 'Badminton', 
    icon: <span aria-hidden>🏸</span>,
    description: 'Racket sport played with a shuttlecock',
    category: 'racket'
  },
];

export const SportSelector: React.FC<SportSelectorProps> = ({ 
  sportType, 
  onSelect, 
  disabled,
  isLoading = false
}) => {
  const [currentFocus, setCurrentFocus] = React.useState<number>(-1);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const currentIndex = SPORT_OPTIONS.findIndex(sport => sport.type === sportType);
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex === SPORT_OPTIONS.length - 1 ? 0 : currentIndex + 1;
        onSelect(SPORT_OPTIONS[nextIndex].type);
        setCurrentFocus(nextIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? SPORT_OPTIONS.length - 1 : currentIndex - 1;
        onSelect(SPORT_OPTIONS[prevIndex].type);
        setCurrentFocus(prevIndex);
        break;
    }
  };

  // Group sports by category
  const groupedSports = React.useMemo(() => {
    return SPORT_OPTIONS.reduce((acc, sport) => {
      if (!acc[sport.category]) {
        acc[sport.category] = [];
      }
      acc[sport.category].push(sport);
      return acc;
    }, {} as Record<string, typeof SPORT_OPTIONS>);
  }, []);

  if (isLoading) {
    return (
      <div className={`w-full flex flex-wrap justify-center gap-4 ${campusDesign.layout}`}>
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="animate-pulse bg-gray-200 h-24 w-32 rounded-xl"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={`w-full flex flex-wrap justify-center gap-4 ${campusDesign.layout}`}
        role="radiogroup"
        aria-label="Select sport type"
        onKeyDown={handleKeyNavigation}
      >
        {Object.entries(groupedSports).map(([category, sports]) => (
          <div key={category} className="w-full">
            <h3 className="text-lg font-semibold capitalize mb-3 text-gray-700">
              {category} Sports
            </h3>
            <div className="flex flex-wrap gap-4">
              {sports.map((sport, index) => (
                <button
                  key={sport.type}
                  type="button"
                  className={`
                    flex flex-col items-center justify-center 
                    ${campusDesign.interactive} 
                    ${campusDesign.animations} 
                    ${campusDesign.focus} 
                    px-4 py-2 text-lg font-semibold rounded-xl shadow-md
                    ${sportType === sport.type ? campusDesign.colors.primary : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-100'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    transform transition-transform duration-200
                    ${sportType === sport.type ? 'scale-105' : 'hover:scale-105'}
                    group
                  `}
                  aria-checked={sportType === sport.type}
                  aria-label={`${sport.label} - ${sport.description}`}
                  role="radio"
                  tabIndex={disabled ? -1 : currentFocus === index ? 0 : -1}
                  onClick={() => !disabled && onSelect(sport.type)}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                      onSelect(sport.type);
                    }
                  }}
                  disabled={disabled}
                  title={sport.description}
                >
                  <span className="text-3xl mb-1 transform transition-transform group-hover:scale-110" aria-hidden>
                    {sport.icon}
                  </span>
                  <span>{sport.label}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap">
                    {sport.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};