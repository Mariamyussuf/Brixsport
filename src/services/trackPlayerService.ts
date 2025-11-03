import { API_BASE_URL } from '@/lib/apiConfig';

export interface TrackRecord {
  id: string;
  playerId: string;
  eventName: string;
  personalBest?: number;
  seasonBest?: number;
  previousPositions?: number[];
  lastUpdated: string;
}

export interface TrackPlayerProfile {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  events: TrackRecord[];
}

/**
 * Track Player Service
 * Handles fetching and managing track-specific player data and records
 */
class TrackPlayerService {
  /**
   * Get the best personal and season times across all events for a player
   * @param trackRecords - Array of track records for the player
   * @returns Object containing best personal and season times
   */
  getBestTimes(trackRecords: TrackRecord[]): { personalBest?: number; seasonBest?: number } {
    if (!trackRecords || trackRecords.length === 0) {
      return {};
    }
    
    const personalBests = trackRecords.map(r => r.personalBest).filter(t => t !== undefined) as number[];
    const seasonBests = trackRecords.map(r => r.seasonBest).filter(t => t !== undefined) as number[];
    
    return {
      personalBest: personalBests.length > 0 ? Math.min(...personalBests) : undefined,
      seasonBest: seasonBests.length > 0 ? Math.min(...seasonBests) : undefined
    };
  }

  /**
   * Get a summary of a player's performance across all events
   * @param trackRecords - Array of track records for the player
   * @returns Object containing performance summary
   */
  getPlayerPerformanceSummary(trackRecords: TrackRecord[]): { 
    totalEvents: number; 
    bestPersonalTime?: number; 
    bestSeasonTime?: number; 
    avgPersonalTime?: number; 
    avgSeasonTime?: number;
    recentPositions?: number[];
    bestEvent?: TrackRecord;
  } {
    if (!trackRecords || trackRecords.length === 0) {
      return { totalEvents: 0 };
    }
    
    const bestTimes = this.getBestTimes(trackRecords);
    
    const personalTimes = trackRecords.map(r => r.personalBest).filter(t => t !== undefined) as number[];
    const seasonTimes = trackRecords.map(r => r.seasonBest).filter(t => t !== undefined) as number[];
    
    const avgPersonalTime = personalTimes.length > 0 ? 
      personalTimes.reduce((sum, time) => sum + time, 0) / personalTimes.length : undefined;
      
    const avgSeasonTime = seasonTimes.length > 0 ? 
      seasonTimes.reduce((sum, time) => sum + time, 0) / seasonTimes.length : undefined;
    
    // Get recent positions from the first event (assuming it's the primary event)
    const recentPositions = trackRecords[0]?.previousPositions || [];
    
    // Find the best event (lowest personal best)
    const bestEvent = trackRecords.reduce((best, current) => 
      (current.personalBest && (!best.personalBest || current.personalBest < best.personalBest)) ? current : best
    );
    
    return {
      totalEvents: trackRecords.length,
      bestPersonalTime: bestTimes.personalBest,
      bestSeasonTime: bestTimes.seasonBest,
      avgPersonalTime,
      avgSeasonTime,
      recentPositions,
      bestEvent
    };
  }
  /**
   * Fetch track records for a specific player
   * @param playerId - The ID of the player
   * @returns Promise with player's track records
   */
  async getPlayerTrackRecords(playerId: string): Promise<TrackRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}/track-records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch track records: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error: any) {
      console.error('Error fetching track records:', error);
      // Instead of returning mock data, properly handle the error
      throw new Error(`Failed to fetch track records for player ${playerId}: ${error.message || error}`);
    }
  }

  /**
   * Fetch comprehensive track profile for a player
   * @param playerId - The ID of the player
   * @returns Promise with player's complete track profile
   */
  async getPlayerTrackProfile(playerId: string): Promise<TrackPlayerProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}/track-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch track profile: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error: any) {
      console.error('Error fetching track profile:', error);
      // Instead of returning mock data, properly handle the error
      throw new Error(`Failed to fetch track profile for player ${playerId}: ${error.message || error}`);
    }
  }

  /**
   * Fetch track records for multiple players
   * @param playerIds - Array of player IDs
   * @returns Promise with track records for all players
   */
  async getMultiplePlayerTrackRecords(playerIds: string[]): Promise<Record<string, TrackRecord[]>> {
    try {
      const records: Record<string, TrackRecord[]> = {};
      
      // Fetch records for each player
      for (const playerId of playerIds) {
        records[playerId] = await this.getPlayerTrackRecords(playerId);
      }
      
      return records;
    } catch (error) {
      console.error('Error fetching multiple player track records:', error);
      return {};
    }
  }

  /**
   * Update a player's track record
   * @param playerId - The ID of the player
   * @param record - The record to update
   * @returns Promise with success status
   */
  async updatePlayerTrackRecord(playerId: string, record: TrackRecord): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}/track-records/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        throw new Error(`Failed to update track record: ${response.status}`);
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error updating track record:', error);
      return false;
    }
  }

  /**
   * Fetch all track athletes from the database
   * @returns Promise with array of track athletes
   */
  async getAllTrackAthletes(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/players?sport=track`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch track athletes: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error: any) {
      console.error('Error fetching track athletes:', error);
      // Instead of returning mock data, properly handle the error
      throw new Error(`Failed to fetch track athletes: ${error.message || error}`);
    }
  }
}

// Export singleton instance
export const trackPlayerService = new TrackPlayerService();