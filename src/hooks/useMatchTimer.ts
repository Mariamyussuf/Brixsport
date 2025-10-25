import { useState, useEffect, useRef, useCallback } from "react";

export type MatchPhase = "first-half" | "second-half" | "extra-time-1" | "extra-time-2" | "penalties" | "finished";
export type MatchType = "Normal" | "Group Stage" | "Knockout" | "Quarter Finals" | "Semi Finals" | "Finals";

export interface TimerPrompt {
  type: "stoppage" | "extra-time" | "penalties" | "continue";
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface UseMatchTimerProps {
  matchType: MatchType;
  halfDuration: number; // in minutes
  onPhaseComplete?: (phase: MatchPhase) => void;
}

export const useMatchTimer = ({
  matchType,
  halfDuration,
  onPhaseComplete
}: UseMatchTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<MatchPhase>("first-half");
  const [displayTime, setDisplayTime] = useState(0); // in seconds
  const [stoppageTime, setStoppageTime] = useState(0);
  const [prompt, setPrompt] = useState<TimerPrompt | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const regulationTime = halfDuration * 60;

  // Timer engine
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current + pausedTimeRef.current) / 1000);
      setDisplayTime(elapsed);

      // Check for end of regulation time
      if (elapsed >= regulationTime && phase !== "penalties" && phase !== "finished") {
        handleRegulationEnd();
      }

      // Check for stoppage time exceeded
      if (stoppageTime > 0 && elapsed >= regulationTime + stoppageTime) {
        handleStoppageExceeded();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, regulationTime, stoppageTime, phase]);

  const handleRegulationEnd = useCallback(() => {
    if (phase === "first-half") {
      setIsRunning(false);
      setPrompt({
        type: "stoppage",
        message: "First half regulation time complete. Add stoppage time?",
        onConfirm: () => {
          const choice = window.prompt(
            "Enter stoppage time (minutes):\n1-5 or custom amount",
            "2"
          );
          if (choice) {
            const minutes = parseInt(choice);
            if (!isNaN(minutes) && minutes > 0) {
              setStoppageTime(minutes * 60);
              setIsRunning(true);
            }
          }
          setPrompt(null);
        },
        onCancel: () => {
          pause();
          setPhase("second-half");
          reset();
          setPrompt(null);
          onPhaseComplete?.("first-half");
        }
      });
    } else if (phase === "second-half") {
      setIsRunning(false);
      // First offer stoppage time for second half
      setPrompt({
        type: "stoppage",
        message: "Second half regulation time complete. Add stoppage time?",
        onConfirm: () => {
          const choice = window.prompt(
            "Enter stoppage time (minutes):\n1-5 or custom amount",
            "3"
          );
          if (choice) {
            const minutes = parseInt(choice);
            if (!isNaN(minutes) && minutes > 0) {
              setStoppageTime(minutes * 60);
              setIsRunning(true);
            }
          }
          setPrompt(null);
        },
        onCancel: () => {
          // After declining stoppage, offer extra time/end match options
          const isKnockout = matchType === "Knockout" || matchType === "Quarter Finals" || 
                             matchType === "Semi Finals" || matchType === "Finals";
          
          if (isKnockout) {
            setPrompt({
              type: "extra-time",
              message: "Start extra time or end match?",
              onConfirm: () => {
                setPhase("extra-time-1");
                reset();
                setIsRunning(true);
                setPrompt(null);
              },
              onCancel: () => {
                pause();
                setPhase("finished");
                setPrompt(null);
                onPhaseComplete?.("second-half");
              }
            });
          } else {
            pause();
            setPhase("finished");
            setPrompt(null);
            onPhaseComplete?.("second-half");
          }
        }
      });
    } else if (phase === "extra-time-1") {
      setIsRunning(false);
      setPrompt({
        type: "stoppage",
        message: "Extra time first half complete. Add stoppage time?",
        onConfirm: () => {
          const choice = window.prompt("Enter stoppage time (minutes):", "1");
          if (choice) {
            const minutes = parseInt(choice);
            if (!isNaN(minutes) && minutes > 0) {
              setStoppageTime(minutes * 60);
              setIsRunning(true);
            }
          }
          setPrompt(null);
        },
        onCancel: () => {
          pause();
          setPhase("extra-time-2");
          reset();
          setPrompt(null);
          onPhaseComplete?.("extra-time-1");
        }
      });
    } else if (phase === "extra-time-2") {
      setIsRunning(false);
      setPrompt({
        type: "stoppage",
        message: "Extra time second half complete. Add stoppage time?",
        onConfirm: () => {
          const choice = window.prompt("Enter stoppage time (minutes):", "1");
          if (choice) {
            const minutes = parseInt(choice);
            if (!isNaN(minutes) && minutes > 0) {
              setStoppageTime(minutes * 60);
              setIsRunning(true);
            }
          }
          setPrompt(null);
        },
        onCancel: () => {
          // After declining stoppage, offer penalties or end match
          setPrompt({
            type: "penalties",
            message: "Start penalty shootout or end match?",
            onConfirm: () => {
              setPhase("penalties");
              reset();
              setPrompt(null);
              onPhaseComplete?.("extra-time-2");
            },
            onCancel: () => {
              pause();
              setPhase("finished");
              setPrompt(null);
              onPhaseComplete?.("extra-time-2");
            }
          });
        }
      });
    }
  }, [phase, matchType, onPhaseComplete]);

  const handleStoppageExceeded = useCallback(() => {
    // Don't pause - allow continuous play like real referee control
    setPrompt({
      type: "continue",
      message: "Added time exceeded. Continue playing or end half?",
      onConfirm: () => {
        // Continue playing - just dismiss prompt
        setPrompt(null);
      },
      onCancel: () => {
        pause();
        if (phase === "first-half") {
          setPhase("second-half");
          reset();
          onPhaseComplete?.("first-half");
        } else if (phase === "second-half") {
          const isKnockout = matchType === "Knockout" || matchType === "Quarter Finals" || 
                             matchType === "Semi Finals" || matchType === "Finals";
          if (isKnockout) {
            setPhase("extra-time-1");
            reset();
          } else {
            setPhase("finished");
          }
          onPhaseComplete?.("second-half");
        } else if (phase === "extra-time-1") {
          setPhase("extra-time-2");
          reset();
          onPhaseComplete?.("extra-time-1");
        } else if (phase === "extra-time-2") {
          setPhase("penalties");
          reset();
          onPhaseComplete?.("extra-time-2");
        }
        setPrompt(null);
      }
    });
  }, [phase, matchType, onPhaseComplete]);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    }
  }, [isRunning]);

  const pause = useCallback(() => {
    if (isRunning) {
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setIsRunning(false);
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setDisplayTime(0);
    setStoppageTime(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, []);

  const addStoppageTime = useCallback((seconds: number) => {
    setStoppageTime(prev => prev + seconds);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning,
    phase,
    displayTime,
    stoppageTime,
    prompt,
    start,
    pause,
    reset,
    addStoppageTime,
    formatTime,
    setPhase
  };
};
