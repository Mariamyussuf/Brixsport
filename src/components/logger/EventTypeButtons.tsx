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
}) => {
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
    <div
      className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      role="radiogroup"
      aria-label={eventScope === 'external' ? 'Select external event type' : 'Select event type'}
    >
      {eventTypes.map((type) => (
        <button
          key={type}
          type="button"
          className={`flex flex-col items-center justify-center px-2 py-3 rounded-xl font-semibold border-2 text-base md:text-lg ${campusDesign.animations} ${campusDesign.focus} ${getButtonStyle(type)}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-checked={selectedEventType === type}
          aria-label={
            eventScope === 'external'
              ? `${formatLabel(type)} (External Event)`
              : formatLabel(type)
          }
          role="radio"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onSelect(type)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              onSelect(type);
            }
          }}
          disabled={disabled}
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
  );
}; 