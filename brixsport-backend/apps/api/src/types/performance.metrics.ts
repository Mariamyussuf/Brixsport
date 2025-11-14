// Player performance metrics interfaces
export interface PlayerPerformanceMetrics {
  performanceRating: number; // Overall performance rating (0-100)
  goalConversionRate: number; // Percentage of shots that result in goals
  passAccuracy: number; // Percentage of passes completed
  shotAccuracy: number; // Percentage of shots on target
  goalInvolvement: number; // Goals + assists
  defensiveActions: number; // Tackles + interceptions + clearances
  disciplinaryRating: number; // Disciplinary record (0-100, higher is better)
  actionsPerMinute: number; // Actions per minute played
  keyPasses: number; // Estimated key passes
  chancesCreated: number; // Estimated chances created
  consistencyRating: number; // Performance consistency (0-100)
  positionalRating: number; // Positional performance (0-100)
  updatedAt: Date; // When metrics were last updated
}

export interface AdvancedPlayerMetrics extends PlayerPerformanceMetrics {
  goalsPerTeamGoal: number; // Player goals as percentage of team goals
  shotsPerTeamShot: number; // Player shots as percentage of team shots
  passesPerTeamPass: number; // Player passes as percentage of team passes
  goalsAgainstPerGame: number; // Average goals conceded by opponents (placeholder)
  expectedGoals: number; // Expected goals based on shot quality
  expectedAssists: number; // Expected assists based on pass quality
  defensiveImpact: number; // Defensive contribution score
  creativityIndex: number; // Creative contribution score
  workRate: number; // Physical work rate score
  updatedAt: Date; // When metrics were last updated
}