import React from 'react';
import { CampusEventType, SportType, EventScope } from '../../types/campus';
import { campusDesign } from '../../styles/campusDesign';

export interface EventTypeButtonsProps {
  eventTypes: CampusEventType[];
  selectedEventType: CampusEventType | null;
  onSelect: (eventType: CampusEventType) => void;
  disabled?: boolean;
  sportType: SportType;
  eventScope?: EventScope; // 'internal' | 'external'
  isLoading?: boolean;
  searchEnabled?: boolean;
  categorized?: boolean;
}

// Emoji/icon map for MVP (can be replaced with SVGs later)
const EVENT_ICONS: Record<CampusEventType, string> = {
  // Football
  goal: '⚽',
  assist: '🅰️',
  save: '🧤',
  yellow_card: '🟨',
  red_card: '🟥',
  foul: '🚫',
  substitution: '🔄',
  corner: '🚩',
  free_kick: '🎯',
  penalty: '🎯',
  // Basketball
  field_goal: '🏀',
  three_pointer: '3️⃣',
  free_throw: '🎯',
  rebound: '🔁',
  steal: '🤚',
  block: '🛡️',
  turnover: '🔄',
  timeout: '⏱️',
  // Track & Field
  race_start: '🏁',
  race_finish: '🏁',
  lap_time: '⏱️',
  false_start: '⚡',
  disqualification: '❌',
  record_attempt: '⭐',
  jump_attempt: '↗️',
  throw_attempt: '🏹',
  measurement: '📏',
  // Volleyball
  serve: '🎾',
  spike: '💥',
  dig: '🤲',
  set: '✋',
  ace: '🌟',
  error: '❗',
  // Table Tennis & Badminton
  point: '🔢',
};

function getEventIcon(eventType: CampusEventType): string {
  return EVENT_ICONS[eventType] || '🏅';
}

function formatLabel(eventType: CampusEventType): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * EventTypeButtons: Responsive, accessible grid of event buttons with icons and labels.
 * Now visually distinguishes internal vs. external events.
 */
export const EventTypeButtons: React.FC<EventTypeButtonsProps> = ({
  eventTypes,
  selectedEventType,
  onSelect,
  disabled,
  sportType,
  eventScope = 'internal',
  isLoading = false,
  searchEnabled = false,
  categorized = false,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentFocus, setCurrentFocus] = React.useState<number>(-1);

  // Filter event types based on search query
  const filteredEventTypes = React.useMemo(() => {
    if (!searchQuery) return eventTypes;
    return eventTypes.filter(type => 
      formatLabel(type).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [eventTypes, searchQuery]);

  // Handle keyboard navigation
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'ArrowRight':
        setCurrentFocus(prev => Math.min(prev + 1, filteredEventTypes.length - 1));
        e.preventDefault();
        break;
      case 'ArrowLeft':
        setCurrentFocus(prev => Math.max(prev - 1, 0));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setCurrentFocus(prev => Math.max(prev - 2, 0));
        e.preventDefault();
        break;
      case 'ArrowDown':
        setCurrentFocus(prev => Math.min(prev + 2, filteredEventTypes.length - 1));
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        if (currentFocus >= 0) {
          onSelect(filteredEventTypes[currentFocus]);
          e.preventDefault();
        }
        break;
    }
  };

  // Use warning color for external events
  const getButtonStyle = (type: CampusEventType) => {
    if (eventScope === 'external') {
      return selectedEventType === type
        ? campusDesign.colors.warning
        : 'bg-yellow-50 text-yellow-900 border-yellow-300 hover:bg-yellow-100';
    }
    return selectedEventType === type
      ? campusDesign.colors.success
      : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100';
  };

  return (
    <div className="space-y-4">
      {searchEnabled && (
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Search event types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse h-24 bg-gray-200 rounded-xl"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div
          className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          role="radiogroup"
          aria-label={eventScope === 'external' ? 'Select external event type' : 'Select event type'}
          onKeyDown={handleKeyNavigation}
        >
          {filteredEventTypes.map((type, index) => (
            <button
              key={type}
              type="button"
              className={`flex flex-col items-center justify-center px-2 py-3 rounded-xl font-semibold border-2 text-base md:text-lg ${campusDesign.animations} ${campusDesign.focus} ${getButtonStyle(type)}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${currentFocus === index ? 'ring-2 ring-blue-500' : ''}
                transition-all duration-200 transform hover:scale-105
              `}
              aria-checked={selectedEventType === type}
              aria-label={
                eventScope === 'external'
                  ? `${formatLabel(type)} (External Event)`
                  : formatLabel(type)
              }
              role="radio"
              tabIndex={disabled ? -1 : currentFocus === index ? 0 : -1}
              onClick={() => !disabled && onSelect(type)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  onSelect(type);
                }
              }}
              disabled={disabled}
              title={`${formatLabel(type)} - Press Enter to select`}
            >
              <span className="text-2xl md:text-3xl mb-1" aria-hidden>{getEventIcon(type)}</span>
              <span className="flex items-center gap-1">
                {formatLabel(type)}
                {eventScope === 'external' && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-yellow-200 text-yellow-900 font-bold">EXT</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};