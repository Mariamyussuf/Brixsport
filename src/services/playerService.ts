import APIService from './APIService';
import { adminPlayerEndpoints } from '@/lib/apiEndpoints';
import { APIResponse } from '@/types/api';
import { 
  Player, 
  CreatePlayerPayload, 
  UpdatePlayerPayload, 
  UpdatePlayerStatsPayload, 
  AssignPlayerToTeamPayload,
  PlayerListParams,
  PlayerSearchParams
} from '@/types/brixsports';

class PlayerService {
  /**
   * Retrieve a list of players with pagination and filtering options (Admin only)
   */
  async getPlayers(
    params?: PlayerListParams,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').PlayerListResponse>> {
    try {
      const endpoint = adminPlayerEndpoints.getPlayers(params);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error('Failed to fetch players:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch players' 
        } 
      };
    }
  }

  /**
   * Retrieve detailed information about a specific player (Admin only)
   */
  async getPlayerById(
    id: string,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Player>> {
    try {
      const endpoint = adminPlayerEndpoints.getPlayerById(id);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error(`Failed to fetch player with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch player details' 
        } 
      };
    }
  }

  /**
   * Create a new player profile (Admin only)
   */
  async createPlayer(
    payload: CreatePlayerPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Player>> {
    try {
      return await APIService.request(
        adminPlayerEndpoints.createPlayer,
        payload,
        undefined,
        options
      );
    } catch (error) {
      console.error('Failed to create player:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to create player' 
        } 
      };
    }
  }

  /**
   * Update an existing player's information (Admin only)
   */
  async updatePlayer(
    id: string,
    payload: UpdatePlayerPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Player>> {
    try {
      const endpoint = adminPlayerEndpoints.updatePlayer(id);
      return await APIService.request(endpoint, payload, undefined, options);
    } catch (error) {
      console.error(`Failed to update player with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to update player' 
        } 
      };
    }
  }

  /**
   * Delete a player profile (soft delete) (Admin only)
   */
  async deletePlayer(
    id: string,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<{ message: string }>> {
    try {
      const endpoint = adminPlayerEndpoints.deletePlayer(id);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error(`Failed to delete player with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to delete player' 
        } 
      };
    }
  }

  /**
   * Retrieve career statistics for a player (Admin only)
   */
  async getPlayerStats(
    id: string,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').CareerStats>> {
    try {
      const endpoint = adminPlayerEndpoints.getPlayerStats(id);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error(`Failed to fetch stats for player with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch player stats' 
        } 
      };
    }
  }

  /**
   * Update player statistics (Admin only)
   */
  async updatePlayerStats(
    id: string,
    payload: UpdatePlayerStatsPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').CareerStats>> {
    try {
      const endpoint = adminPlayerEndpoints.updatePlayerStats(id);
      return await APIService.request(endpoint, payload, undefined, options);
    } catch (error) {
      console.error(`Failed to update stats for player with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to update player stats' 
        } 
      };
    }
  }

  /**
   * Assign a player to a team (Admin only)
   */
  async assignPlayerToTeam(
    id: string,
    payload: AssignPlayerToTeamPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<{ message: string; player: Player }>> {
    try {
      const endpoint = adminPlayerEndpoints.assignPlayerToTeam(id);
      return await APIService.request(endpoint, payload, undefined, options);
    } catch (error) {
      console.error(`Failed to assign player with id ${id} to team:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to assign player to team' 
        } 
      };
    }
  }

  /**
   * Remove a player from their current team (Admin only)
   */
  async removePlayerFromTeam(
    id: string,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<{ message: string; player: Player }>> {
    try {
      const endpoint = adminPlayerEndpoints.removePlayerFromTeam(id);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error(`Failed to remove player with id ${id} from team:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to remove player from team' 
        } 
      };
    }
  }

  /**
   * Advanced search for players (Admin only)
   */
  async searchPlayers(
    params?: PlayerSearchParams,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').PlayerSearchResponse>> {
    try {
      const endpoint = adminPlayerEndpoints.searchPlayers(params);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error('Failed to search players:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to search players' 
        } 
      };
    }
  }
}

export default new PlayerService();