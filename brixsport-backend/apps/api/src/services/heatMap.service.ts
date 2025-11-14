import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

// Heat map data structures
export interface PositionData {
  x: number; // X coordinate on the field (0-100 as percentage)
  y: number; // Y coordinate on the field (0-100 as percentage)
  timestamp: Date;
  eventType?: string; // Type of event at this position
  playerId?: string;
  teamId?: string;
}

export interface HeatMapCell {
  x: number; // X coordinate of the cell
  y: number; // Y coordinate of the cell
  intensity: number; // Heat intensity (0-100)
  count: number; // Number of events in this cell
  events: PositionData[]; // Detailed events in this cell
}

export interface HeatMapData {
  matchId: string;
  playerId?: string;
  teamId?: string;
  cells: HeatMapCell[];
  gridSize: {
    width: number; // Number of cells horizontally
    height: number; // Number of cells vertically
  };
  totalTime: number; // Total time in seconds
  generatedAt: Date;
}

// Error types for better error handling
export class HeatMapServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'HeatMapServiceError';
  }
}

export class EntityNotFoundError extends HeatMapServiceError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'ENTITY_NOT_FOUND', 404, { entityType, entityId });
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends HeatMapServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends HeatMapServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'DATABASE_ERROR', 500, originalError);
    this.name = 'DatabaseError';
  }
}

// Heat map generation service
export const heatMapService = {
  // Generate heat map for a specific match
  generateMatchHeatMap: async (matchId: string, gridSize: { width: number; height: number } = { width: 10, height: 6 }): Promise<HeatMapData> => {
    try {
      logger.info('Generating match heat map', { matchId, gridSize });
      
      // Get match events with position data
      const eventsResult = await supabaseService.getMatchEventsByMatch(matchId);
      if (!eventsResult.success) {
        throw new DatabaseError('Failed to fetch match events');
      }
      
      const events = eventsResult.data || [];
      
      // Filter events with position data
      const positionEvents: PositionData[] = events
        .filter((event: any) => event.additionalData?.x !== undefined && event.additionalData?.y !== undefined)
        .map((event: any) => ({
          x: event.additionalData.x,
          y: event.additionalData.y,
          timestamp: new Date(event.timestamp),
          eventType: event.eventType,
          playerId: event.playerId,
          teamId: event.teamId
        }));
      
      // Generate heat map cells
      const cells = heatMapService.generateHeatMapCells(positionEvents, gridSize);
      
      // Calculate total time (simplified - would need actual match duration)
      const totalTime = 90 * 60; // 90 minutes in seconds
      
      const heatMapData: HeatMapData = {
        matchId,
        cells,
        gridSize,
        totalTime,
        generatedAt: new Date()
      };
      
      return heatMapData;
    } catch (error: any) {
      logger.error('Generate match heat map error', error);
      if (error instanceof HeatMapServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to generate match heat map', error);
    }
  },
  
  // Generate heat map for a specific player in a match
  generatePlayerHeatMap: async (matchId: string, playerId: string, gridSize: { width: number; height: number } = { width: 10, height: 6 }): Promise<HeatMapData> => {
    try {
      logger.info('Generating player heat map', { matchId, playerId, gridSize });
      
      // Get match events with position data for specific player
      const eventsResult = await supabaseService.listMatchEvents({ matchId, playerId });
      if (!eventsResult.success) {
        throw new DatabaseError('Failed to fetch player match events');
      }
      
      const events = eventsResult.data || [];
      
      // Filter events with position data
      const positionEvents: PositionData[] = events
        .filter((event: any) => event.additionalData?.x !== undefined && event.additionalData?.y !== undefined)
        .map((event: any) => ({
          x: event.additionalData.x,
          y: event.additionalData.y,
          timestamp: new Date(event.timestamp),
          eventType: event.eventType,
          playerId: event.playerId,
          teamId: event.teamId
        }));
      
      // Generate heat map cells
      const cells = heatMapService.generateHeatMapCells(positionEvents, gridSize);
      
      // Calculate total time (simplified - would need actual player time on field)
      const totalTime = 90 * 60; // 90 minutes in seconds
      
      const heatMapData: HeatMapData = {
        matchId,
        playerId,
        cells,
        gridSize,
        totalTime,
        generatedAt: new Date()
      };
      
      return heatMapData;
    } catch (error: any) {
      logger.error('Generate player heat map error', error);
      if (error instanceof HeatMapServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to generate player heat map', error);
    }
  },
  
  // Generate heat map for a specific team in a match
  generateTeamHeatMap: async (matchId: string, teamId: string, gridSize: { width: number; height: number } = { width: 10, height: 6 }): Promise<HeatMapData> => {
    try {
      logger.info('Generating team heat map', { matchId, teamId, gridSize });
      
      // Get match events with position data for specific team
      const eventsResult = await supabaseService.listMatchEvents({ matchId, teamId });
      if (!eventsResult.success) {
        throw new DatabaseError('Failed to fetch team match events');
      }
      
      const events = eventsResult.data || [];
      
      // Filter events with position data
      const positionEvents: PositionData[] = events
        .filter((event: any) => event.additionalData?.x !== undefined && event.additionalData?.y !== undefined)
        .map((event: any) => ({
          x: event.additionalData.x,
          y: event.additionalData.y,
          timestamp: new Date(event.timestamp),
          eventType: event.eventType,
          playerId: event.playerId,
          teamId: event.teamId
        }));
      
      // Generate heat map cells
      const cells = heatMapService.generateHeatMapCells(positionEvents, gridSize);
      
      // Calculate total time (simplified - would need actual match duration)
      const totalTime = 90 * 60; // 90 minutes in seconds
      
      const heatMapData: HeatMapData = {
        matchId,
        teamId,
        cells,
        gridSize,
        totalTime,
        generatedAt: new Date()
      };
      
      return heatMapData;
    } catch (error: any) {
      logger.error('Generate team heat map error', error);
      if (error instanceof HeatMapServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to generate team heat map', error);
    }
  },
  
  // Generate heat map cells from position data
  generateHeatMapCells: (positionEvents: PositionData[], gridSize: { width: number; height: number }): HeatMapCell[] => {
    try {
      // Initialize grid cells
      const cells: HeatMapCell[] = [];
      
      // Create empty cells
      for (let y = 0; y < gridSize.height; y++) {
        for (let x = 0; x < gridSize.width; x++) {
          cells.push({
            x,
            y,
            intensity: 0,
            count: 0,
            events: []
          });
        }
      }
      
      // Process position events and assign to cells
      positionEvents.forEach(event => {
        // Convert percentage coordinates to grid coordinates
        const gridX = Math.min(gridSize.width - 1, Math.floor((event.x / 100) * gridSize.width));
        const gridY = Math.min(gridSize.height - 1, Math.floor((event.y / 100) * gridSize.height));
        
        // Find the corresponding cell
        const cellIndex = gridY * gridSize.width + gridX;
        if (cellIndex >= 0 && cellIndex < cells.length) {
          const cell = cells[cellIndex];
          cell.count++;
          cell.events.push(event);
        }
      });
      
      // Calculate intensity for each cell
      const maxCount = Math.max(...cells.map(cell => cell.count), 1);
      
      cells.forEach(cell => {
        if (maxCount > 0) {
          cell.intensity = Math.round((cell.count / maxCount) * 100);
        }
      });
      
      return cells;
    } catch (error: any) {
      logger.error('Generate heat map cells error', error);
      throw new HeatMapServiceError('Failed to generate heat map cells', 'HEAT_MAP_GENERATION_ERROR', 500, error);
    }
  },
  
  // Generate aggregated heat map for multiple matches
  generateAggregatedHeatMap: async (
    matchIds: string[], 
    playerId?: string, 
    teamId?: string,
    gridSize: { width: number; height: number } = { width: 10, height: 6 }
  ): Promise<HeatMapData> => {
    try {
      logger.info('Generating aggregated heat map', { matchIds, playerId, teamId, gridSize });
      
      // Collect position events from all matches
      const allPositionEvents: PositionData[] = [];
      
      for (const matchId of matchIds) {
        let eventsResult;
        
        if (playerId) {
          eventsResult = await supabaseService.listMatchEvents({ matchId, playerId });
        } else if (teamId) {
          eventsResult = await supabaseService.listMatchEvents({ matchId, teamId });
        } else {
          eventsResult = await supabaseService.getMatchEventsByMatch(matchId);
        }
        
        if (eventsResult.success && eventsResult.data) {
          const events = eventsResult.data;
          
          // Filter events with position data
          const positionEvents: PositionData[] = events
            .filter((event: any) => event.additionalData?.x !== undefined && event.additionalData?.y !== undefined)
            .map((event: any) => ({
              x: event.additionalData.x,
              y: event.additionalData.y,
              timestamp: new Date(event.timestamp),
              eventType: event.eventType,
              playerId: event.playerId,
              teamId: event.teamId
            }));
          
          allPositionEvents.push(...positionEvents);
        }
      }
      
      // Generate heat map cells
      const cells = heatMapService.generateHeatMapCells(allPositionEvents, gridSize);
      
      // Calculate total time (simplified)
      const totalTime = matchIds.length * 90 * 60; // Number of matches * 90 minutes
      
      const heatMapData: HeatMapData = {
        matchId: 'aggregated',
        playerId,
        teamId,
        cells,
        gridSize,
        totalTime,
        generatedAt: new Date()
      };
      
      return heatMapData;
    } catch (error: any) {
      logger.error('Generate aggregated heat map error', error);
      if (error instanceof HeatMapServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to generate aggregated heat map', error);
    }
  },
  
  // Get heat map data for a specific match/player/team
  getHeatMapData: async (matchId: string, playerId?: string, teamId?: string): Promise<HeatMapData> => {
    try {
      logger.info('Fetching heat map data', { matchId, playerId, teamId });
      
      // In a real implementation, this would fetch from a cache or database
      // For now, we'll generate it on-demand
      if (playerId) {
        return heatMapService.generatePlayerHeatMap(matchId, playerId);
      } else if (teamId) {
        return heatMapService.generateTeamHeatMap(matchId, teamId);
      } else {
        return heatMapService.generateMatchHeatMap(matchId);
      }
    } catch (error: any) {
      logger.error('Get heat map data error', error);
      if (error instanceof HeatMapServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to get heat map data', error);
    }
  },
  
  // Normalize heat map data for visualization
  normalizeHeatMapData: (heatMapData: HeatMapData): HeatMapData => {
    try {
      // Ensure all coordinates are within bounds
      const normalizedCells = heatMapData.cells.map(cell => ({
        ...cell,
        x: Math.max(0, Math.min(heatMapData.gridSize.width - 1, cell.x)),
        y: Math.max(0, Math.min(heatMapData.gridSize.height - 1, cell.y)),
        intensity: Math.max(0, Math.min(100, cell.intensity))
      }));
      
      return {
        ...heatMapData,
        cells: normalizedCells
      };
    } catch (error: any) {
      logger.error('Normalize heat map data error', error);
      return heatMapData;
    }
  }
};