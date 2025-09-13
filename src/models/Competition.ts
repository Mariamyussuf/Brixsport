// Competition Model
export interface Competition {
  id: string;
  name: string;
  season: string;
  type: string; // e.g., 'football', 'basketball', 'track'
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitionDocument extends Competition {
  _id: string;
}

// This file now only contains the Competition interface definitions
// The mock data has been moved to the competitionService.ts file
