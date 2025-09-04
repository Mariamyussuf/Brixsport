import React, { useState, useRef, useEffect } from 'react';
import { campusDesign } from '../../styles/campusDesign';

// Proper SpeechRecognition interface declaration
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: any;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): SpeechRecognition;
    };
  }
}

export interface TrackFieldTimerProps {
  onLap: (lapTime: number) => void;
  onFinish: (totalTime: number, laps: number[]) => void;
  disabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  preset?: 'sprint' | '400m' | '800m' | '1500m' | 'custom';
}

interface TimerHistoryEntry {
  timestamp: number;
  laps: number[];
  total: number;
}

const HISTORY_KEY = 'trackFieldTimerHistory';
const STATE_KEY = 'trackFieldTimerState';

// Preset configurations
const PRESETS = {
  sprint: { expectedLaps: 1, targetTime: 12000, warningTime: 15000 },
  '400m': { expectedLaps: 1, targetTime: 60000, warningTime: 70000 },
  '800m': { expectedLaps: 2, targetTime: 120000, warningTime: 140000 },
  '1500m': { expectedLaps: 3.75, targetTime: 240000, warningTime: 270000 },
  custom: { expectedLaps: null, targetTime: null, warningTime: null },
};

// Sound effects
const SOUNDS = {
  start: new Audio('data:audio/wav;base64,...'), // Base64 encoded short beep
  lap: new Audio('data:audio/wav;base64,...'),   // Base64 encoded click
  finish: new Audio('data:audio/wav;base64,...'), // Base64 encoded success tone
};

function usePersistentTimer(disabled: boolean) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const { running, paused, startTime, elapsed, laps } = JSON.parse(saved);
      setRunning(running);
      setPaused(paused);
      setStartTime(startTime);
      setElapsed(elapsed);
      setLaps(laps);
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ running, paused, startTime, elapsed, laps }));
  }, [running, paused, startTime, elapsed, laps]);

  // Timer logic
  useEffect(() => {
    if (running && !paused && !disabled) {
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - (startTime ?? Date.now()));
      }, 50);
    } else if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, [running, paused, startTime, disabled]);

  // Warn before leaving if running
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (running && !paused) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [running, paused]);

  // Update current lap time
  useEffect(() => {
    if (running && !paused && !disabled) {
      setCurrentLapTime(elapsed - laps.reduce((a, b) => a + b, 0));
    }
  }, [elapsed, laps, running, paused, disabled]);

  // Controls
  const start = () => {
    if (disabled || running) return;
    setRunning(true);
    setPaused(false);
    setStartTime(Date.now() - elapsed);
  };
  const pause = () => { if (running && !paused) setPaused(true); };
  const resume = () => { if (running && paused) setPaused(false); };
  const reset = () => {
    setRunning(false);
    setPaused(false);
    setStartTime(null);
    setElapsed(0);
    setLaps([]);
    localStorage.removeItem(STATE_KEY);
  };
  const lap = () => {
    if (!running || paused) return;
    setLaps((prev) => [...prev, elapsed - prev.reduce((a, b) => a + b, 0)]);
  };
  const undoLap = () => {
    setLaps((prev) => prev.slice(0, -1));
  };

  return {
    running, paused, elapsed, laps, currentLapTime,
    start, pause, resume, reset, lap, undoLap,
    setLaps, setElapsed, setRunning, setPaused
  };
}

function useHistory() {
  const [history, setHistory] = useState<TimerHistoryEntry[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);
  const addHistory = (entry: TimerHistoryEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };
  return { history, addHistory, clearHistory };
}

function formatTime(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

// Mini chart component for lap time visualization
const LapTimeChart: React.FC<{ laps: number[] }> = ({ laps }) => {
  if (laps.length === 0) return null;

  const max = Math.max(...laps);
  const min = Math.min(...laps);
  const range = max - min;
  const height = 40;

  return (
    <div className="w-full h-10 flex items-end gap-1">
      {laps.map((lap, i) => {
        const barHeight = range === 0 ? height : ((lap - min) / range) * height;
        return (
          <div
            key={i}
            className="flex-1 bg-blue-500 transition-all duration-300"
            style={{ height: `${barHeight}px` }}
            title={`Lap ${i + 1}: ${formatTime(lap)}`}
          />
        );
      })}
    </div>
  );
};

export const TrackFieldTimer: React.FC<TrackFieldTimerProps> = ({
  onLap,
  onFinish,
  disabled,
  soundEnabled = true,
  vibrationEnabled = true,
  preset = 'custom'
}) => {
  const {
    running, paused, elapsed, laps, currentLapTime,
    start, pause, resume, reset, lap, undoLap,
    setLaps, setElapsed, setRunning, setPaused
  } = usePersistentTimer(!!disabled);
  
  const { history, addHistory, clearHistory } = useHistory();
  const [ariaLive, setAriaLive] = useState('');
  const lapListRef = useRef<HTMLDivElement>(null);
  const presetConfig = PRESETS[preset];

  // Play sound and vibrate
  const playFeedback = (type: 'start' | 'lap' | 'finish') => {
    if (soundEnabled) {
      SOUNDS[type].play().catch(() => {});
    }
    if (vibrationEnabled && navigator.vibrate) {
      switch (type) {
        case 'start': navigator.vibrate(100); break;
        case 'lap': navigator.vibrate(50); break;
        case 'finish': navigator.vibrate([100, 50, 100]); break;
      }
    }
  };

  // Enhanced start handler
  const handleStart = () => {
    if (disabled || running) return;
    start();
    playFeedback('start');
  };

  // Enhanced lap handler
  const handleLap = () => {
    lap();
    const lapTime = currentLapTime;
    setAriaLive(`Lap ${laps.length + 1} recorded: ${formatTime(lapTime)}`);
    onLap(lapTime);
    playFeedback('lap');
  };

  // Enhanced finish handler
  const handleFinish = () => {
    if (!running || paused) return;
    const totalTime = elapsed;
    const allLaps = [...laps, currentLapTime];
    setLaps(allLaps);
    setRunning(false);
    setPaused(false);
    setElapsed(0);
    onFinish(totalTime, allLaps);
    addHistory({ timestamp: Date.now(), laps: allLaps, total: totalTime });
    setAriaLive(`Timer finished. Total time: ${formatTime(totalTime)}`);
    localStorage.removeItem(STATE_KEY);
    playFeedback('finish');
  };

  // Voice command handling
  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return;
    
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResultIndex = event.results.length - 1;
      const command = event.results[lastResultIndex][0].transcript.toLowerCase();
      
      if (command.includes('start')) handleStart();
      if (command.includes('lap')) handleLap();
      if (command.includes('stop') || command.includes('finish')) handleFinish();
      if (command.includes('reset')) reset();
    };
    
    recognition.start();
    return () => recognition.stop();
  }, [running, paused]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.code === 'Space') { 
        e.preventDefault();
        running ? (paused ? resume() : pause()) : start(); 
      }
      if (e.key.toLowerCase() === 'l') lap();
      if (e.key.toLowerCase() === 'r') reset();
      if (e.key.toLowerCase() === 'u') undoLap();
      if (e.key.toLowerCase() === 'f') handleFinish();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [running, paused, disabled, start, pause, resume, lap, reset, undoLap]);

  // Auto-scroll to latest lap
  useEffect(() => {
    if (lapListRef.current) {
      lapListRef.current.scrollTop = lapListRef.current.scrollHeight;
    }
  }, [laps]);

  // Export/Copy
  const handleCopy = () => {
    const text = laps.map((lap, i) => `Lap ${i + 1}: ${formatTime(lap)}`).join('\n') + `\nTotal: ${formatTime(laps.reduce((a, b) => a + b, 0))}`;
    navigator.clipboard.writeText(text);
    setAriaLive('Lap times copied to clipboard');
  };
  const handleExport = () => {
    const csv = 'Lap,Time\n' + laps.map((lap, i) => `${i + 1},${formatTime(lap)}`).join('\n') + `\nTotal,${formatTime(laps.reduce((a, b) => a + b, 0))}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `track-timer-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setAriaLive('Lap times exported as CSV');
  };

  // Highlight fastest/slowest lap
  const fastest = laps.length > 0 ? Math.min(...laps) : null;
  const slowest = laps.length > 0 ? Math.max(...laps) : null;

  return (
    <div className={`w-full flex flex-col items-center gap-4 ${campusDesign.layout}`} aria-label="Track & Field Timer">
      {/* Main timer display with split */}
      <div className="flex flex-col items-center">
        <div className="text-4xl font-mono font-bold" aria-live="polite">
          {formatTime(elapsed)}
        </div>
        {running && (
          <div className="text-2xl font-mono text-gray-600">
            Lap: {formatTime(currentLapTime)}
          </div>
        )}
      </div>

      {/* Preset indicator if applicable */}
      {preset !== 'custom' && (
        <div className="text-sm font-semibold text-gray-600">
          {preset.toUpperCase()} - Target: {formatTime(presetConfig.targetTime!)}
        </div>
      )}

      {/* Existing buttons with enhanced mobile support */}
      <div className="flex gap-2 flex-wrap justify-center">
        {!running && !paused && (
          <button
            type="button"
            className={`${campusDesign.interactive} ${campusDesign.colors.primary} ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
            onClick={handleStart}
            disabled={running || disabled}
            aria-label="Start Timer (Space)"
          >Start</button>
        )}
        {running && !paused && (
          <>
            <button
              type="button"
              className={`${campusDesign.interactive} ${campusDesign.colors.success} ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
              onClick={handleLap}
              disabled={paused || disabled}
              aria-label="Lap (L)"
            >Lap</button>
            <button
              type="button"
              className={`${campusDesign.interactive} ${campusDesign.colors.warning} ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
              onClick={handleFinish}
              disabled={paused || disabled}
              aria-label="Finish (F)"
            >Finish</button>
            <button
              type="button"
              className={`${campusDesign.interactive} bg-gray-300 hover:bg-gray-400 text-black ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
              onClick={pause}
              disabled={paused || disabled}
              aria-label="Pause (Space)"
            >Pause</button>
          </>
        )}
        {running && paused && (
          <button
            type="button"
            className={`${campusDesign.interactive} bg-blue-200 hover:bg-blue-300 text-black ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
            onClick={resume}
            disabled={!paused || disabled}
            aria-label="Resume (Space)"
          >Resume</button>
        )}
        <button
          type="button"
          className={`${campusDesign.interactive} ${campusDesign.colors.danger} ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
          onClick={reset}
          disabled={running || disabled}
          aria-label="Reset (R)"
        >Reset</button>
        <button
          type="button"
          className={`${campusDesign.interactive} bg-yellow-200 hover:bg-yellow-300 text-black ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
          onClick={undoLap}
          disabled={laps.length === 0 || running || disabled}
          aria-label="Undo Last Lap (U)"
        >Undo Lap</button>
        <button
          type="button"
          className={`${campusDesign.interactive} bg-green-200 hover:bg-green-300 text-black ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
          onClick={handleCopy}
          disabled={laps.length === 0}
          aria-label="Copy Lap Times"
        >Copy</button>
        <button
          type="button"
          className={`${campusDesign.interactive} bg-blue-200 hover:bg-blue-300 text-black ${campusDesign.animations} ${campusDesign.focus} px-6 py-2 text-lg font-bold rounded-xl`}
          onClick={handleExport}
          disabled={laps.length === 0}
          aria-label="Export Lap Times"
        >Export</button>
      </div>
      <div className="sr-only" aria-live="polite">{ariaLive}</div>
      {laps.length > 0 && (
        <div className="w-full max-w-md">
          <LapTimeChart laps={laps} />
          <h4 className="font-semibold mb-2">Lap Times</h4>
          <div ref={lapListRef} className="max-h-48 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {laps.map((lap, i) => (
                <li key={i} className={`flex justify-between py-1 text-sm font-mono ${lap === fastest ? 'bg-green-100' : ''} ${lap === slowest ? 'bg-red-100' : ''}`}>
                  <span>Lap {i + 1}</span>
                  <span>{formatTime(lap)}</span>
                  {lap === fastest && <span className="ml-2 text-green-700 font-bold">Fastest</span>}
                  {lap === slowest && <span className="ml-2 text-red-700 font-bold">Slowest</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div className="w-full max-w-md mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">History (Last 10 Sessions)</h4>
            <button
              type="button"
              className="text-xs text-red-600 underline"
              onClick={clearHistory}
            >Clear</button>
          </div>
          <ul className="divide-y divide-gray-200">
            {history.map((entry, idx) => (
              <li key={entry.timestamp} className="py-2 text-xs font-mono">
                <span className="font-bold">{new Date(entry.timestamp).toLocaleString()}</span><br />
                {entry.laps.map((lap, i) => (
                  <span key={i}>Lap {i + 1}: {formatTime(lap)} </span>
                ))}<br />
                <span>Total: {formatTime(entry.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};