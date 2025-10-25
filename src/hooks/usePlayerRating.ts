import { useMemo, useCallback } from "react";

export type Sport = "football" | "basketball" | "track";

export interface EventWeights {
  [key: string]: number;
}

export interface RatingConfig {
  sport: Sport;
  eventWeights: EventWeights;
  timeWeight: number;
  contextWeight: number;
  disciplineWeight: number;
}

// Default event weights
const FOOTBALL_WEIGHTS: EventWeights = {
  goal: 8,
  assist: 5,
  keyPass: 2,
  tackle: 1,
  interception: 1,
  foul: -1,
  yellowCard: -2,
  redCard: -5,
  save: 3,
  shotOnTarget: 1,
  shotOffTarget: -0.5
};

const BASKETBALL_WEIGHTS: EventWeights = {
  "2pt": 2,
  "3pt": 3,
  freeThrow: 1,
  assist: 2,
  rebound: 1,
  steal: 2,
  block: 2,
  turnover: -2,
  foul: -1
};

export const usePlayerRating = (sport: Sport) => {
  const config: RatingConfig = useMemo(() => {
    const eventWeights = sport === "football" ? FOOTBALL_WEIGHTS : 
                        sport === "basketball" ? BASKETBALL_WEIGHTS : {};
    
    return {
      sport,
      eventWeights,
      timeWeight: 0.2,
      contextWeight: 0.2,
      disciplineWeight: 0.1
    };
  }, [sport]);

  const calculateRating = useCallback((
    events: Array<{ type: string; value?: number }>,
    minutesPlayed: number,
    matchMinutes: number,
    contextMultiplier: number = 1
  ): number => {
    // Event score
    const eventScore = events.reduce((sum, event) => {
      const weight = config.eventWeights[event.type] || 0;
      return sum + weight * (event.value || 1);
    }, 0);

    // Time weight (normalized to match duration)
    const timeWeight = (minutesPlayed / matchMinutes) * 10;

    // Context weight
    const contextWeight = contextMultiplier * 2;

    // Calculate rating
    const rating = (eventScore * 0.5) + (timeWeight * config.timeWeight) + 
                   (contextWeight * config.contextWeight);

    // Clamp between 0-10
    return Math.max(0, Math.min(10, rating));
  }, [config]);

  const calculateTrackRating = useCallback((
    performance: number,
    bestPerformance: number
  ): number => {
    if (bestPerformance === 0) return 5.0;
    
    const ratio = bestPerformance / performance;
    const rating = ratio * 10;
    
    return Math.max(0, Math.min(10, rating));
  }, []);

  const updateEventWeights = useCallback((newWeights: Partial<EventWeights>) => {
    Object.assign(config.eventWeights, newWeights);
  }, [config]);

  return {
    calculateRating,
    calculateTrackRating,
    updateEventWeights,
    config
  };
};
