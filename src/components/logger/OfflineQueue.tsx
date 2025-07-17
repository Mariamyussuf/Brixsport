import React, { useState, useEffect, useRef } from 'react';
import { EventLog, Team, Player } from '../../types/campus';
import { campusDesign } from '../../styles/campusDesign';

export interface OfflineQueueProps {
  queue: EventLog[];
  onRetry: (event: EventLog) => void;
  onRemove: (eventId: string) => void;
  syncingIds?: string[];
  failedIds?: string[];
  errorMap?: Record<string, string>; // eventId -> error message
  teamsMap?: Record<string, Team>;
  playersMap?: Record<string, Player>;
}

const QUEUE_KEY = 'offlineEventQueue';
const AUTO_RETRY_INTERVAL = 10000; // 10s

const EVENT_ICONS: Partial<Record<string, string>> = {
  goal: '⚽', assist: '🅰️', save: '🧤', yellow_card: '🟨', red_card: '🟥', foul: '🚫', substitution: '🔄', corner: '🚩', free_kick: '🎯', penalty: '🎯',
  field_goal: '🏀', three_pointer: '3️⃣', free_throw: '🎯', rebound: '🔁', steal: '🤚', block: '🛡️', turnover: '🔄', timeout: '⏱️',
  race_start: '🏁', race_finish: '🏁', lap_time: '⏱️', false_start: '⚡', disqualification: '❌', record_attempt: '⭐', jump_attempt: '↗️', throw_attempt: '🏹', measurement: '📏',
  serve: '🎾', spike: '💥', dig: '🤲', set: '✋', ace: '🌟', error: '❗', point: '🔢',
};

function getEventIcon(type: string) {
  return EVENT_ICONS[type] || '🏅';
}

export const OfflineQueue: React.FC<OfflineQueueProps> = ({
  queue: propQueue,
  onRetry,
  onRemove,
  syncingIds = [],
  failedIds = [],
  errorMap = {},
  teamsMap = {},
  playersMap = {},
}) => {
  // Persist queue in localStorage
  const [queue, setQueue] = useState<EventLog[]>(propQueue);
  const [expanded, setExpanded] = useState(true);
  const [ariaLive, setAriaLive] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const autoRetryRef = useRef<number | null>(null);

  // Sync propQueue to local state and localStorage
  useEffect(() => {
    setQueue(propQueue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(propQueue));
  }, [propQueue]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(QUEUE_KEY);
    if (saved) setQueue(JSON.parse(saved));
  }, []);

  // Auto-retry failed events
  useEffect(() => {
    if (queue.length === 0) return;
    if (autoRetryRef.current) clearInterval(autoRetryRef.current);
    autoRetryRef.current = window.setInterval(() => {
      queue.forEach((event) => {
        if (failedIds.includes(event.id)) {
          onRetry(event);
          setAriaLive(`Auto-retrying event ${event.id}`);
        }
      });
    }, AUTO_RETRY_INTERVAL);
    return () => { if (autoRetryRef.current) clearInterval(autoRetryRef.current); };
  }, [queue, failedIds, onRetry]);

  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!expanded || !listRef.current) return;
      const items = Array.from(listRef.current.querySelectorAll('li[tabindex="0"]'));
      const active = document.activeElement;
      const idx = items.indexOf(active as HTMLLIElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = items[(idx + 1) % items.length];
        (next as HTMLElement)?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = items[(idx - 1 + items.length) % items.length];
        (prev as HTMLElement)?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded]);

  // Batch actions
  const handleRetryAll = () => {
    queue.forEach((event) => onRetry(event));
    setAriaLive('Retrying all events');
  };
  const handleClearAll = () => {
    queue.forEach((event) => onRemove(event.id));
    setAriaLive('Cleared all events from queue');
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(queue, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-queue-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setAriaLive('Exported queue as JSON');
  };

  if (queue.length === 0) return null;

  return (
    <div className={`w-full max-w-2xl mx-auto mt-6 ${campusDesign.layout}`} aria-label="Offline Event Queue">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">Offline Event Queue</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs underline text-blue-700"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? 'Collapse queue' : 'Expand queue'}
          >{expanded ? 'Collapse' : 'Expand'}</button>
          <button
            type="button"
            className="text-xs underline text-green-700"
            onClick={handleRetryAll}
            aria-label="Retry all events"
          >Retry All</button>
          <button
            type="button"
            className="text-xs underline text-red-700"
            onClick={handleClearAll}
            aria-label="Clear all events"
          >Clear All</button>
          <button
            type="button"
            className="text-xs underline text-blue-700"
            onClick={handleExport}
            aria-label="Export queue as JSON"
          >Export</button>
          <button
            type="button"
            className="text-xs underline text-gray-700"
            onClick={() => setShowRaw((s) => !s)}
            aria-label="Show raw event data"
          >{showRaw ? 'Hide Raw' : 'Show Raw'}</button>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">{ariaLive}</div>
      {expanded && (
        <ul className="divide-y divide-gray-200" ref={listRef}>
          {queue.map((event, idx) => {
            const isSyncing = syncingIds.includes(event.id);
            const isFailed = failedIds.includes(event.id);
            let status = 'Pending';
            let statusIcon = '⏳';
            let statusColor = 'text-yellow-600';
            if (isSyncing) {
              status = 'Syncing...';
              statusIcon = '🔄';
              statusColor = 'text-blue-600 animate-spin';
            } else if (isFailed) {
              status = 'Failed';
              statusIcon = '❌';
              statusColor = 'text-red-600';
            }
            const team = event.teamId ? teamsMap[event.teamId] : undefined;
            const player = event.playerId ? playersMap[event.playerId] : undefined;
            return (
              <li
                key={event.id}
                className={`flex flex-col md:flex-row md:items-center gap-2 py-2 transition-opacity duration-300`}
                tabIndex={0}
                aria-label={`Offline event ${event.eventType}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-2xl" aria-hidden>{getEventIcon(event.eventType)}</span>
                    <span className="font-semibold">{event.eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                    {team && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{team.name}</span>}
                    {player && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{player.name}</span>}
                    {event.value && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Value: {event.value}</span>}
                    <span className={`text-xs font-bold flex items-center gap-1 ${statusColor}`}>{statusIcon} {status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(event.timestamp).toLocaleString()}</div>
                  {isFailed && errorMap[event.id] && (
                    <div className="text-xs text-red-600 mt-1">Error: {errorMap[event.id]}</div>
                  )}
                  {showRaw && (
                    <pre className="text-xs bg-gray-100 rounded p-2 mt-2 overflow-x-auto">{JSON.stringify(event, null, 2)}</pre>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`${campusDesign.interactive} ${campusDesign.colors.success} ${campusDesign.animations} ${campusDesign.focus} px-3 py-1 text-xs font-bold rounded-lg`}
                    onClick={() => onRetry(event)}
                    disabled={isSyncing}
                    aria-label="Retry Sync"
                  >Retry</button>
                  <button
                    type="button"
                    className={`${campusDesign.interactive} ${campusDesign.colors.danger} ${campusDesign.animations} ${campusDesign.focus} px-3 py-1 text-xs font-bold rounded-lg`}
                    onClick={() => onRemove(event.id)}
                    disabled={isSyncing}
                    aria-label="Remove from Queue"
                  >Remove</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

