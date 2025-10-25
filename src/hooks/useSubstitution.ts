import { useState, useCallback } from "react";

export interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
  isOnPitch: boolean;
  isEligible: boolean;
  minutesPlayed: number;
  subbedInAt?: number;
  subbedOutAt?: number;
}

export interface SubstitutionEvent {
  time: number;
  playerOut: Player;
  playerIn: Player;
  reason?: string;
}

export interface SubstitutionRules {
  maxPerTeam: number;
  allowDuringExtraTime: boolean;
  extraSubsInET: number;
  allowReentry: boolean;
}

const DEFAULT_RULES: SubstitutionRules = {
  maxPerTeam: 5,
  allowDuringExtraTime: true,
  extraSubsInET: 1,
  allowReentry: false
};

export const useSubstitution = (rules: SubstitutionRules = DEFAULT_RULES) => {
  const [substitutions, setSubstitutions] = useState<SubstitutionEvent[]>([]);

  const makeSubstitution = useCallback((
    playerOut: Player,
    playerIn: Player,
    currentTime: number,
    reason?: string
  ): { success: boolean; message?: string } => {
    // Validate substitution
    if (!playerOut.isOnPitch) {
      return { success: false, message: "Player is not on pitch" };
    }

    if (!playerIn.isEligible) {
      return { success: false, message: "Player is not eligible" };
    }

    if (substitutions.length >= rules.maxPerTeam) {
      return { success: false, message: "Maximum substitutions reached" };
    }

    // Record substitution
    const newSub: SubstitutionEvent = {
      time: currentTime,
      playerOut,
      playerIn,
      reason
    };

    setSubstitutions(prev => [...prev, newSub]);

    return { success: true };
  }, [substitutions, rules]);

  const getEligiblePlayersIn = useCallback((players: Player[]) => {
    return players.filter(p => !p.isOnPitch && p.isEligible);
  }, []);

  const getEligiblePlayersOut = useCallback((players: Player[]) => {
    return players.filter(p => p.isOnPitch);
  }, []);

  const getRemainingSubstitutions = useCallback(() => {
    return rules.maxPerTeam - substitutions.length;
  }, [substitutions, rules]);

  const getStoppageTimeRecommendation = useCallback(() => {
    return substitutions.length * 30; // 30 seconds per substitution
  }, [substitutions]);

  return {
    substitutions,
    makeSubstitution,
    getEligiblePlayersIn,
    getEligiblePlayersOut,
    getRemainingSubstitutions,
    getStoppageTimeRecommendation
  };
};
