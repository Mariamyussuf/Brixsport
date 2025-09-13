import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RotateCcw, Clock } from 'lucide-react';
import { loggerService } from '@/lib/loggerService';
import { MatchStatus } from '@/types/matchTracker'; // Import the correct MatchStatus type

const convertMatchStatus = (status: import('@/types/matchEvents').MatchStatus): MatchStatus => {
  switch (status) {
    case 'scheduled':
      return 'scheduled';
    case 'live':
    case 'half-time':
    case 'full-time':
      return 'live';
    case 'postponed':
      // For postponed matches, we'll treat them as scheduled in the tracker
      return 'scheduled';
    default:
      // Handle any other cases by returning 'scheduled' as a fallback
      return 'scheduled';
  }
};

interface TimerControlProps {
  matchId: string;
  status: MatchStatus;
  onStatusChange: (status: MatchStatus) => void;
  onTimeUpdate: (minutes: number, seconds: number) => void;
  initialMinutes?: number;
  initialSeconds?: number;
  onHalfTime?: () => void;
}

export const TimerControl: React.FC<TimerControlProps> = ({
  matchId,
  status,
  onStatusChange,
  onTimeUpdate,
  initialMinutes = 0,
  initialSeconds = 0,
  onHalfTime
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Handle timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - lastUpdateRef.current) / 1000; // seconds
        lastUpdateRef.current = now;

        setSeconds(prev => {
          const newSeconds = prev + elapsed;
          if (newSeconds >= 60) {
            setMinutes(min => min + Math.floor(newSeconds / 60));
            return newSeconds % 60;
          }
          return newSeconds;
        });
      }, 100); // Update every 100ms for smooth display
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Notify parent of time updates
  useEffect(() => {
    onTimeUpdate(Math.floor(minutes), Math.floor(seconds));
  }, [minutes, seconds, onTimeUpdate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleStop();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isRunning]);

  const handlePlayPause = async () => {
    if (status === 'scheduled') {
      // Start the match
      try {
        const response = await loggerService.startMatch(matchId);
        if (response.success && response.data) {
          // Convert the status from logger format to tracker format
          const convertedStatus = convertMatchStatus(response.data.status);
          onStatusChange(convertedStatus);
          setIsRunning(true);
          lastUpdateRef.current = Date.now();
        }
      } catch (error) {
        console.error('Failed to start match:', error);
        alert('Failed to start match. Please try again.');
      }
    } else if (status === 'live') {
      if (isRunning) {
        setIsRunning(false);
      } else {
        setIsRunning(true);
        lastUpdateRef.current = Date.now();
      }
    }
  };

  const handleStop = async () => {
    if (isRunning || status === 'live') {
      setIsRunning(false);
      try {
        const response = await loggerService.endMatch(matchId);
        if (response.success && response.data) {
          // Convert the status from logger format to tracker format
          const convertedStatus = convertMatchStatus(response.data.status);
          onStatusChange(convertedStatus);
        }
      } catch (error) {
        console.error('Failed to end match:', error);
        alert('Failed to end match. Please try again.');
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(0);
    setSeconds(0);
    if (status === 'live' || status === 'completed') {
      onStatusChange('scheduled');
    }
  };

  const formatTime = (min: number, sec: number) => {
    const minutes = Math.floor(min).toString().padStart(2, '0');
    const seconds = Math.floor(sec).toString().padStart(2, '0');
    const milliseconds = Math.floor((sec % 1) * 10).toString();
    return `${minutes}:${seconds}.${milliseconds}`;
  };

  const isPlayable = status === 'scheduled' || status === 'live';
  const canStop = status === 'live';
  const canReset = status !== 'scheduled';
  const showHalfTime = status === 'live' && isRunning && minutes >= 40 && minutes < 50;
  const showFullTime = status === 'live' && minutes >= 85;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex flex-col items-center gap-4">
        {/* Timer Display */}
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-400" />
          <div className="text-3xl font-mono font-bold">
            {formatTime(minutes, seconds)}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-300' :
            status === 'live' ? 'bg-green-500/20 text-green-300 animate-pulse' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={handlePlayPause}
            disabled={!isPlayable}
            className={status === 'scheduled' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {status === 'scheduled' || !isRunning ? (
              <Play className="w-4 h-4 mr-2" />
            ) : (
              <Pause className="w-4 h-4 mr-2" />
            )}
            {status === 'scheduled' ? 'Start Match' : isRunning ? 'Pause' : 'Resume'}
          </Button>

          {canStop && (
            <Button onClick={handleStop} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}

          {canReset && (
            <Button onClick={handleReset} variant="secondary">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}

          {showHalfTime && (
            <Button 
              onClick={() => {
                setIsRunning(false);
                // Log half-time event
                onHalfTime?.();
              }} 
              variant="secondary" 
              className="bg-orange-600 hover:bg-orange-700"
            >
              Half Time
            </Button>
          )}

          {showFullTime && (
            <Button 
              onClick={handleStop} 
              variant="secondary" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Full Time
            </Button>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="text-xs text-gray-400 mt-2">
          <p>Keyboard: [Space] Play/Pause, [S] Stop, [R] Reset</p>
        </div>
      </div>
    </div>
  );
};