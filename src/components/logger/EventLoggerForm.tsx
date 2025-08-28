import React, { useState } from 'react';
import { Match, SportType, EventLog, CampusEventType, Team, Player, Semester, EventScope } from '../../types/campus';
import { campusDesign } from '../../styles/campusDesign';
import { PlayerSelector } from './PlayerSelector';
import { EventTypeButtons } from './EventTypeButtons';
import { FixedSizeList as List } from 'react-window';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export interface EventLoggerFormProps {
  currentMatch: Match;
  sportType: SportType;
  onEventSubmit: (event: EventLog) => void;
  isOffline: boolean;
  semesterOptions?: Semester[];
}

/**
 * Main event logging form for match officials.
 * Now supports >2 teams, internal/external events, semester, and event queue.
 */
export const EventLoggerForm: React.FC<EventLoggerFormProps> = ({
  currentMatch,
  sportType,
  onEventSubmit,
  isOffline,
  semesterOptions,
}) => {
  // State for selected team, player, event type, value, eventScope, semester
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<CampusEventType | null>(null);
  const [eventValue, setEventValue] = useState<string | number>('');
  const [eventScope, setEventScope] = useState<EventScope>('internal');
  const [semester, setSemester] = useState<Semester>(currentMatch.semester || (semesterOptions ? semesterOptions[0] : ''));
  const [error, setError] = useState<string | null>(null);
  const [eventQueue, setEventQueue] = useState<EventLog[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventLog | null>(null);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [pinnedEventIds, setPinnedEventIds] = useState<Set<string>>(new Set());
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string | number>('');
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [batchEditFields, setBatchEditFields] = useState({
    eventType: '',
    value: '',
    playerId: '',
    eventScope: '',
  });
  const [inlineEditFields, setInlineEditFields] = useState({ eventType: '', value: '', playerId: '', eventScope: '' })

  const [liveMessage, setLiveMessage] = useState('');
  const eventRefs = React.useRef<(HTMLLIElement | null)[]>([]);


  const eventTypes: CampusEventType[] = React.useMemo(() => {
    switch (sportType) {
      case 'football':
        return [
          'goal', 'assist', 'save', 'yellow_card', 'red_card', 'foul',
          'substitution', 'corner', 'free_kick', 'penalty',
        ];
      case 'basketball':
        return [
          'field_goal', 'three_pointer', 'free_throw', 'rebound', 'assist',
          'steal', 'block', 'turnover', 'foul', 'timeout',
        ];
      case 'track_events':
        return [
          'race_start', 'lap_time', 'race_finish', 'false_start', 'disqualification',
          'record_attempt', 'jump_attempt', 'throw_attempt', 'measurement',
        ];
      case 'volleyball':
        return [
          'serve', 'spike', 'block', 'dig', 'set', 'ace', 'error',
        ];
      case 'table_tennis':
        return ['point', 'serve', 'error', 'timeout'];
      case 'badminton':
        return ['point', 'serve', 'error', 'timeout'];
      default:
        return [];
    }
  }, [sportType]);

  // Get selected player object
  const selectedPlayer = selectedTeam?.players.find((p) => p.id === selectedPlayerId) || null;
  function validateEvent({ eventType, selectedTeam, selectedPlayerId, eventValue }: {
    eventType: CampusEventType | null,
    selectedTeam: Team | null,
    selectedPlayerId: string | null,
    eventValue: string | number
  }): string | null {
    if (!selectedTeam || !eventType) return 'Please select a team and event type.';
    if ([
      'football', 'basketball', 'volleyball', 'table_tennis', 'badminton',
    ].includes(sportType) && !selectedPlayerId) return 'Please select a player.';
    if (sportType === 'track_events' && !eventValue) return 'Please enter a value (e.g., time, measurement).';
    // Prevent duplicate event in the same second
    const nowSec = Math.floor(Date.now() / 1000);
    if (eventQueue.some(ev => ev.eventType === eventType && Math.floor(ev.timestamp / 1000) === nowSec)) {
      return 'Duplicate event detected in the same second.';
    }
    // Player number validation
    if (selectedPlayerId) {
      const player = selectedTeam.players.find(p => p.id === selectedPlayerId);
      if (player && player.number && isNaN(Number(player.number))) {
        return 'Player number must be numeric.';
      }
    }
    // Custom: no more than 11 players for football
    if (sportType === 'football' && selectedTeam.players.length > 11) {
      return 'Cannot have more than 11 players on the field for football.';
    }
    return null;
  }

  // Handle event submission (add or edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateEvent({ eventType, selectedTeam, selectedPlayerId, eventValue });
    if (validationError) {
      setError(validationError);
      return;
    }
    const newEvent: EventLog = {
      id: editingEvent ? editingEvent.id : `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      matchId: currentMatch.id,
      teamId: selectedTeam!.id,
      playerId: selectedPlayerId || undefined,
      eventType: eventType!,
      timestamp: editingEvent ? editingEvent.timestamp : Date.now(),
      value: eventValue || undefined,
      offline: isOffline,
      eventScope,
      semester,
    };
    onEventSubmit(newEvent);
    setEventQueue((q) => {
      if (editingEvent) {
        // Replace the edited event
        return q.map(ev => ev.id === editingEvent.id ? newEvent : ev);
      }
      return [newEvent, ...q];
    });
    setEditingEvent(null);
    setEventType(null);
    setSelectedPlayerId(null);
    setEventValue('');
  };

  const handleUndo = () => {
    setShowUndoConfirm(false);
    setEventQueue((q) => q.slice(1));
    // setAriaLive('Last event undone'); // aria-live is not standard for form submission
  };

  // Edit last event
  const handleEdit = () => {
    const last = eventQueue[0];
    if (!last) return;
    setEditingEvent(last);
    setEventType(last.eventType);
    setSelectedTeam(currentMatch.teams.find(t => t.id === last.teamId) || null);
    setSelectedPlayerId(last.playerId || null);
    setEventValue(last.value || '');
  };

  // Handler for selecting/deselecting events
  const handleSelectEvent = (id: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const handleSelectAll = () => {
    if (selectedEventIds.size === eventQueue.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(eventQueue.map(ev => ev.id)));
    }
  };

  // Handler for pinning events
  const handlePinEvent = (id: string) => {
    setPinnedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Batch actions
  const handleBatchUndo = () => {
    setEventQueue((q) => q.filter(ev => !selectedEventIds.has(ev.id)));
    setSelectedEventIds(new Set());
  };
  const handleBatchDelete = handleBatchUndo; // For now, same as undo
  const handleBatchEdit = () => {
    // For demo: just edit the first selected event
    const firstId = Array.from(selectedEventIds)[0];
    const ev = eventQueue.find(ev => ev.id === firstId);
    if (ev) {
      setInlineEditId(ev.id);
      setInlineEditValue(ev.value || '');
    }
    setShowBatchEdit(true);
  };

  // Inline editing handlers
  // Update inline edit fields when starting edit
  const startInlineEdit = (ev: EventLog) => {
    setInlineEditId(ev.id);
    setInlineEditFields({
      eventType: ev.eventType,
      value: ev.value !== undefined && ev.value !== null ? String(ev.value) : '',
      playerId: ev.playerId ?? '',
      eventScope: ev.eventScope ?? 'internal',
    });
  };

  const handleInlineEditFieldChange = (field: keyof typeof inlineEditFields, value: string) => {
    setInlineEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleInlineEditSave = (id: string) => {
    setEventQueue((q) =>
      q.map(ev =>
        ev.id === id
          ? {
              ...ev,
              eventType: inlineEditFields.eventType as CampusEventType,
              value: inlineEditFields.value,
              playerId: inlineEditFields.playerId,
              eventScope: inlineEditFields.eventScope as EventScope,
            }
          : ev
      )
    );
    setInlineEditId(null);
    setInlineEditFields({ eventType: '', value: '', playerId: '', eventScope: '' });
  };
  const handleInlineEditCancel = () => {
    setInlineEditId(null);
    setInlineEditFields({ eventType: '', value: '', playerId: '', eventScope: '' });
  };

  // Handler for drag-and-drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const allEvents = [...eventQueue];
    // Separate pinned and unpinned
    const pinned = allEvents.filter(ev => pinnedEventIds.has(ev.id));
    const unpinned = allEvents.filter(ev => !pinnedEventIds.has(ev.id));
    // Only allow reordering within pinned or within unpinned
    const isPinned = result.source.index < pinned.length;
    const list = isPinned ? pinned : unpinned;
    const from = isPinned ? result.source.index : result.source.index - pinned.length;
    const to = isPinned ? result.destination.index : result.destination.index - pinned.length;
    const [removed] = list.splice(from, 1);
    list.splice(to, 0, removed);
    const newQueue = isPinned ? [...list, ...unpinned] : [...pinned, ...list];
    setEventQueue(newQueue);
  };

  const handleBatchEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEvents = eventQueue.map(ev => {
      if (selectedEventIds.has(ev.id)) {
        return {
          ...ev,
          eventType: batchEditFields.eventType ? (batchEditFields.eventType as CampusEventType) : ev.eventType,
          value: batchEditFields.value !== '' ? batchEditFields.value : ev.value,
          playerId: batchEditFields.playerId !== '' ? batchEditFields.playerId : ev.playerId,
          eventScope: batchEditFields.eventScope ? (batchEditFields.eventScope as EventScope) : ev.eventScope,
        } as EventLog;
      }
      return ev;
    });
    setEventQueue(updatedEvents);
    setSelectedEventIds(new Set());
    setShowBatchEdit(false);
    setBatchEditFields({ eventType: '', value: '', playerId: '', eventScope: '' });
  };

  const handleBatchEditFieldChange = (field: keyof typeof batchEditFields, value: string) => {
    setBatchEditFields(prev => ({ ...prev, [field]: value }));
  };

  // Keyboard navigation handler
  const handleEventListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const focusIdx = eventRefs.current.findIndex(ref => ref === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (focusIdx + 1) % eventQueue.length;
      eventRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (focusIdx - 1 + eventQueue.length) % eventQueue.length;
      eventRefs.current[prevIdx]?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (focusIdx !== -1) {
        const ev = eventQueue[focusIdx];
        handleSelectEvent(ev.id);
        setLiveMessage(selectedEventIds.has(ev.id) ? `Event deselected` : `Event selected`);
      }
    } else if (e.key === 'Escape') {
      setSelectedEventIds(new Set());
      setInlineEditId(null);
      setLiveMessage('Selection or editing cancelled');
    }
  };

  // Announce selection changes
  React.useEffect(() => {
    if (selectedEventIds.size > 0) {
      setLiveMessage(`${selectedEventIds.size} event${selectedEventIds.size > 1 ? 's' : ''} selected`);
    }
  }, [selectedEventIds]);

  // Announce edit/save
  const handleInlineEditSaveWithLive = (id: string) => {
    handleInlineEditSave(id);
    setLiveMessage('Event edited');
  };

  // Announce drag-and-drop
  const handleDragEndWithLive = (result: DropResult) => {
    handleDragEnd(result);
    if (result.destination && result.source.index !== result.destination.index) {
      setLiveMessage('Event moved');
    }
  };

  return (
    <form
      className={`w-full max-w-2xl mx-auto flex flex-col gap-6 ${campusDesign.layout}`}
      onSubmit={handleSubmit}
      aria-label="Event Logger Form"
    >
      {/* Semester selector if options provided */}
      {semesterOptions && (
        <div>
          <label className="block mb-1 font-semibold">Semester</label>
          <select
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            {semesterOptions.map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
      )}

      {/* Event scope selector */}
      <div className="flex gap-4 items-center">
        <label className="font-semibold">Event Scope:</label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="eventScope"
            value="internal"
            checked={eventScope === 'internal'}
            onChange={() => setEventScope('internal')}
            className="accent-blue-600"
          />
          <span>Internal</span>
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="eventScope"
            value="external"
            checked={eventScope === 'external'}
            onChange={() => setEventScope('external')}
            className="accent-yellow-500"
          />
          <span>External</span>
        </label>
      </div>

      {/* Team selection (supports >2 teams) */}
      <div className="flex flex-wrap gap-4 justify-center">
        {currentMatch.teams.map((team) => (
          <button
            key={team.id}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border-2 ${campusDesign.animations} ${campusDesign.focus}
              ${selectedTeam?.id === team.id ? campusDesign.colors.primary : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100'}
            `}
            style={{ borderColor: team.color }}
            aria-pressed={selectedTeam?.id === team.id}
            onClick={() => setSelectedTeam(team)}
          >
            {team.logoUrl && (
              <img src={team.logoUrl} alt="" className="w-6 h-6 rounded-full" aria-hidden />
            )}
            <span>{team.name}</span>
          </button>
        ))}
      </div>

      {/* Player selection (uses updated PlayerSelector) */}
      {selectedTeam && (
        <PlayerSelector
          players={selectedTeam.players}
          selectedPlayerId={selectedPlayerId}
          onSelect={setSelectedPlayerId}
          teamColor={selectedTeam.color}
          disabled={selectedTeam.players.length === 0}
        />
      )}

      {/* Event type buttons (uses updated EventTypeButtons) */}
      <EventTypeButtons
        eventTypes={eventTypes}
        selectedEventType={eventType}
        onSelect={setEventType}
        disabled={false}
        sportType={sportType}
      />

      {/* Value input for track/field or other events */}
      {sportType === 'track_events' && eventType && (
        <div>
          <label className="block mb-1 font-semibold">Value (Time, Measurement, etc.)</label>
          <input
            type="text"
            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            value={eventValue}
            onChange={(e) => setEventValue(e.target.value)}
            placeholder="e.g., 12.34s, 6.5m"
            required
          />
        </div>
      )}

      {/* Error message */}
      {error && <div className="text-red-600 font-semibold">{error}</div>}

      {/* Submit button */}
      <button
        type="submit"
        className={`w-full mt-2 ${campusDesign.interactive} ${campusDesign.colors.primary} ${campusDesign.animations} ${campusDesign.focus} text-lg font-bold`}
        disabled={isOffline}
      >
        {isOffline ? 'Offline: Save to Queue' : 'Log Event'}
      </button>

      {/* Event queue/timeline with multi-select, batch actions, pinning, inline editing, and drag-and-drop */}
      {eventQueue.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Event Queue / Timeline</h3>
          {/* Batch action bar */}
          {selectedEventIds.size > 0 && (
            <div className="mb-2 flex gap-2 items-center bg-blue-50 border border-blue-200 rounded-lg p-2">
              <span className="font-semibold">{selectedEventIds.size} selected</span>
              <button type="button" className="text-xs px-2 py-1 rounded bg-red-600 text-white font-bold" onClick={handleBatchUndo}>Undo</button>
              <button type="button" className="text-xs px-2 py-1 rounded bg-gray-600 text-white font-bold" onClick={handleBatchDelete}>Delete</button>
              <button type="button" className="text-xs px-2 py-1 rounded bg-yellow-600 text-white font-bold" onClick={handleBatchEdit} disabled={selectedEventIds.size !== 1}>Edit</button>
              <button type="button" className="text-xs px-2 py-1 rounded bg-blue-200 text-blue-900 font-bold" onClick={() => setSelectedEventIds(new Set())}>Clear</button>
            </div>
          )}
          <DragDropContext onDragEnd={handleDragEndWithLive}>
            <Droppable droppableId="event-queue-droppable">
              {(provided) => (
                <ul
                  className="space-y-2"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  tabIndex={0}
                  onKeyDown={handleEventListKeyDown}
                  aria-label="Event queue list"
                >
                  {/* ARIA live region for feedback */}
                  <div className="sr-only" aria-live="polite">{liveMessage}</div>
                  {/* Sort: pinned events first */}
                  {[...eventQueue].sort((a, b) => {
                    const aPinned = pinnedEventIds.has(a.id);
                    const bPinned = pinnedEventIds.has(b.id);
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    return 0;
                  }).map((ev, idx) => (
                    <Draggable key={ev.id} draggableId={ev.id} index={idx} isDragDisabled={false}>
                      {(dragProvided, dragSnapshot) => (
                        <li
                          ref={el => {
                            eventRefs.current[idx] = el;
                            if (typeof dragProvided.innerRef === 'function') dragProvided.innerRef(el);
                          }}
                          tabIndex={0}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`p-2 rounded-lg bg-gray-50 border border-gray-200 flex flex-col md:flex-row md:items-center gap-2 ${pinnedEventIds.has(ev.id) ? 'ring-2 ring-yellow-400' : ''} ${dragSnapshot.isDragging ? 'bg-blue-100' : ''}`}
                          aria-label={`Event ${ev.eventType} at ${new Date(ev.timestamp).toLocaleTimeString()}`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedEventIds.has(ev.id)}
                              onChange={() => handleSelectEvent(ev.id)}
                              aria-label={`Select event ${ev.eventType}`}
                            />
                            <button
                              type="button"
                              className={`text-xl ${pinnedEventIds.has(ev.id) ? 'text-yellow-500' : 'text-gray-400'} focus:outline-none`}
                              onClick={() => handlePinEvent(ev.id)}
                              aria-label={pinnedEventIds.has(ev.id) ? 'Unpin event' : 'Pin event'}
                            >📌</button>
                          </div>
                          <span className="font-semibold">{ev.eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                          <span className="text-xs text-gray-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                          <span className="text-xs text-gray-600">{ev.eventScope === 'external' ? 'External' : 'Internal'}</span>
                          {inlineEditId === ev.id ? (
                            <>
                              <select
                                className="w-32 p-1 border rounded"
                                value={inlineEditFields.eventType}
                                onChange={e => handleInlineEditFieldChange('eventType', e.target.value)}
                                aria-label="Edit event type"
                              >
                                {eventTypes.map(type => (
                                  <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                ))}
                              </select>
                              <select
                                className="w-32 p-1 border rounded"
                                value={inlineEditFields.playerId}
                                onChange={e => handleInlineEditFieldChange('playerId', e.target.value)}
                                aria-label="Edit player"
                              >
                                <option value="">(None)</option>
                                {selectedTeam?.players.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <select
                                className="w-28 p-1 border rounded"
                                value={inlineEditFields.eventScope}
                                onChange={e => handleInlineEditFieldChange('eventScope', e.target.value)}
                                aria-label="Edit event scope"
                              >
                                <option value="internal">Internal</option>
                                <option value="external">External</option>
                              </select>
                              <input
                                type="text"
                                className="w-24 p-1 border rounded"
                                value={inlineEditFields.value}
                                onChange={e => handleInlineEditFieldChange('value', e.target.value)}
                                aria-label="Edit value"
                              />
                              <button type="button" className="text-xs px-2 py-1 rounded bg-green-600 text-white font-bold" onClick={() => handleInlineEditSaveWithLive(ev.id)}>Save</button>
                              <button type="button" className="text-xs px-2 py-1 rounded bg-gray-400 text-white font-bold" onClick={handleInlineEditCancel}>Cancel</button>
                            </>
                          ) : (
                            ev.value && <span className="text-xs text-gray-700">Value: {ev.value}</span>
                          )}
                          {ev.playerId && <span className="text-xs text-gray-700">Player: {selectedTeam?.players.find(p => p.id === ev.playerId)?.name}</span>}
                          <span className="text-xs text-gray-400">{semester}</span>
                          <div className="flex gap-2 mt-2 md:mt-0">
                            <button
                              type="button"
                              className={`${campusDesign.interactive} ${campusDesign.colors.danger} ${campusDesign.animations} ${campusDesign.focus} px-2 py-1 text-xs font-bold rounded-lg`}
                              onClick={() => setShowUndoConfirm(true)}
                              aria-label="Undo last event"
                            >Undo</button>
                            <button
                              type="button"
                              className={`${campusDesign.interactive} ${campusDesign.colors.warning} ${campusDesign.animations} ${campusDesign.focus} px-2 py-1 text-xs font-bold rounded-lg`}
                              onClick={() => startInlineEdit(ev)}
                              aria-label="Edit event"
                            >Edit</button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {/* Select all checkbox */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedEventIds.size === eventQueue.length && eventQueue.length > 0}
              onChange={handleSelectAll}
              aria-label="Select all events"
            />
            <span className="text-xs">Select All</span>
          </div>
        </div>
      )}

      {/* Undo confirmation dialog */}
      {showUndoConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full flex flex-col gap-4">
            <div className="font-bold text-lg">Undo Last Event?</div>
            <div className="text-gray-700">Are you sure you want to remove the most recent event? This cannot be undone.</div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className={`${campusDesign.interactive} ${campusDesign.colors.danger} ${campusDesign.animations} ${campusDesign.focus} px-4 py-1 rounded-lg`}
                onClick={handleUndo}
              >Yes, Undo</button>
              <button
                type="button"
                className={`${campusDesign.interactive} ${campusDesign.colors.primary} ${campusDesign.animations} ${campusDesign.focus} px-4 py-1 rounded-lg`}
                onClick={() => setShowUndoConfirm(false)}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Edit Modal */}
      {showBatchEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <form
            className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full flex flex-col gap-4"
            onSubmit={handleBatchEditSubmit}
            aria-label="Batch Edit Events"
          >
            <h4 className="font-bold text-lg">Batch Edit Events</h4>
            <label className="block">
              <span className="font-semibold">Event Type</span>
              <select
                className="w-full p-2 rounded border"
                value={batchEditFields.eventType}
                onChange={e => handleBatchEditFieldChange('eventType', e.target.value)}
              >
                <option value="">(No Change)</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-semibold">Value</span>
              <input
                type="text"
                className="w-full p-2 rounded border"
                value={batchEditFields.value}
                onChange={e => handleBatchEditFieldChange('value', e.target.value)}
                placeholder="(No Change)"
              />
            </label>
            <label className="block">
              <span className="font-semibold">Player</span>
              <select
                className="w-full p-2 rounded border"
                value={batchEditFields.playerId}
                onChange={e => handleBatchEditFieldChange('playerId', e.target.value)}
              >
                <option value="">(No Change)</option>
                {selectedTeam?.players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-semibold">Event Scope</span>
              <select
                className="w-full p-2 rounded border"
                value={batchEditFields.eventScope}
                onChange={e => handleBatchEditFieldChange('eventScope', e.target.value)}
              >
                <option value="">(No Change)</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </label>
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-1 rounded bg-gray-400 text-white font-bold" onClick={() => setShowBatchEdit(false)}>Cancel</button>
              <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white font-bold">Save</button>
            </div>
          </form>
        </div>
      )}
    </form>
  );
}; 