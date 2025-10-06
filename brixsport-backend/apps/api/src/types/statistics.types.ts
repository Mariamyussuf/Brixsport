// Statistics type definitions
export interface PlayerStatistics {
  id: string; // UUID
  playerId: string;
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  
  // Common statistics
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  
  // Sport-specific statistics
  // Football
  football?: {
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    saves: number;
    passesCompleted: number;
    passAccuracy: number;
    tackles: number;
    interceptions: number;
    foulsCommitted: number;
    foulsSuffered: number;
  };
  
  // Basketball
  basketball?: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    fieldGoalPercentage: number;
    threePointersMade: number;
    threePointersAttempted: number;
    threePointPercentage: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    freeThrowPercentage: number;
    turnovers: number;
    personalFouls: number;
  };
  
  // Track
  track?: {
    eventsParticipated: number;
    firstPlaceFinishes: number;
    secondPlaceFinishes: number;
    thirdPlaceFinishes: number;
    personalBests: {
      event: string;
      time?: string;
      distance?: number;
      date: Date;
    }[];
  };
  
  // Aggregated data
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamStatistics {
  id: string; // UUID
  teamId: string;
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  
  // Common statistics
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  
  // Sport-specific statistics
  // Football
  football?: {
    cleanSheets: number;
    goalsConceded: number;
    shots: number;
    shotsOnTarget: number;
    possession: number;
    passesCompleted: number;
    passAccuracy: number;
    tackles: number;
    interceptions: number;
    foulsCommitted: number;
    yellowCards: number;
    redCards: number;
  };
  
  // Basketball
  basketball?: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    fieldGoalPercentage: number;
    threePointersMade: number;
    threePointersAttempted: number;
    threePointPercentage: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    freeThrowPercentage: number;
    turnovers: number;
    personalFouls: number;
  };
  
  // Track
  track?: {
    eventsParticipated: number;
    goldMedals: number;
    silverMedals: number;
    bronzeMedals: number;
    totalMedals: number;
    bestPerformances: {
      event: string;
      position: number;
      time?: string;
      distance?: number;
      date: Date;
    }[];
  };
  
  // Aggregated data
  winPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitionStatistics {
  id: string; // UUID
  competitionId: string;
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  
  // General statistics
  totalMatches: number;
  totalTeams: number;
  totalPlayers: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  totalYellowCards: number;
  totalRedCards: number;
  
  // Sport-specific statistics
  // Football
  football?: {
    totalCleanSheets: number;
    totalGoalsConceded: number;
    averagePossession: number;
    totalShots: number;
    totalShotsOnTarget: number;
    passAccuracy: number;
  };
  
  // Basketball
  basketball?: {
    totalPoints: number;
    averagePointsPerGame: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    totalRebounds: number;
    totalAssists: number;
    totalSteals: number;
    totalBlocks: number;
    totalTurnovers: number;
  };
  
  // Track
  track?: {
    totalEvents: number;
    totalParticipants: number;
    medalDistribution: {
      gold: number;
      silver: number;
      bronze: number;
    };
    recordPerformances: {
      event: string;
      time?: string;
      distance?: number;
      playerName: string;
      teamName: string;
      date: Date;
    }[];
  };
  
  // Time-based trends
  monthlyTrends: {
    month: string;
    matches: number;
    goals: number;
    cards: number;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceTrend {
  id: string; // UUID
  entityId: string; // Player ID, Team ID, or Competition ID
  entityType: 'PLAYER' | 'TEAM' | 'COMPETITION';
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON';
  
  // Performance metrics
  formRating: number; // 1-100 scale
  performanceScore: number; // Calculated performance score
  improvementRate: number; // Percentage improvement
  consistencyRating: number; // 1-100 scale
  
  // Comparative data
  ranking: number; // Current ranking in league/competition
  rankingChange: number; // Change in ranking
  comparisonWithAverage: number; // Percentage compared to league average
  
  // Sport-specific metrics
  sportMetrics: {
    // Can vary based on sport
    [key: string]: number;
  };
  
  // Metadata
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface Standing {
  team: TeamBasicInfo;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TeamBasicInfo {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface TopPerformer {
  player: PlayerBasicInfo;
  team: TeamBasicInfo;
  value: number;
}

export interface PlayerBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profilePictureUrl?: string;
}

export interface PlayerComparison {
  player: PlayerStatistics;
  comparison: {
    versus: string; // "league_average" or player names
    metrics: {
      [key: string]: {
        player: number;
        comparison: number;
        difference: number;
        percentage: number;
      }
    }
  }
}

export interface TeamComparison {
  team: TeamStatistics;
  comparison: {
    versus: string; // "league_average" or team names
    metrics: {
      [key: string]: {
        team: number;
        comparison: number;
        difference: number;
        percentage: number;
      }
    }
  }
}

export interface AnalyticsReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  performance: {
    overallRating: number;
    form: string; // "Excellent", "Good", "Average", "Poor"
    improvement: number; // Percentage
    consistency: number; // 1-100 scale
  };
  keyMetrics: {
    [key: string]: {
      value: number;
      rank: number;
      percentile: number;
    }
  };
  trends: {
    [key: string]: number[];
  };
}

export interface PlayerAnalyticsReport {
  player: PlayerBasicInfo;
  report: AnalyticsReport;
}

export interface TeamAnalyticsReport {
  team: TeamBasicInfo;
  report: AnalyticsReport;
}

export interface ComparisonResult {
  comparison: {
    entities: {
      id: string;
      name: string;
      metrics: {
        [key: string]: number;
      }
    }[];
    analysis: {
      bestPerformer: {
        id: string;
        metric: string;
      };
      closestCompetition: {
        entity1: string;
        entity2: string;
        similarity: number; // 0-1 scale
      };
    }
  }
}