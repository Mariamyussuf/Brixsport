import { logger } from '../utils/logger';
import { supabaseService, supabase } from './supabase.service';

// Define the Favorite type to match the database schema
interface Favorite {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export const favoritesService = {
  // Get all user favorites (teams, competitions, players)
  getUserFavorites: async (userId: string) => {
    try {
      logger.info('Fetching all user favorites from Supabase', { userId });
      
      // Fetch all favorites for the user from Supabase
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      // Separate favorites by type
      const teams = favorites.filter((f: Favorite) => f.entity_type === 'team');
      const competitions = favorites.filter((f: Favorite) => f.entity_type === 'competition');
      const players = favorites.filter((f: Favorite) => f.entity_type === 'player');
      
      return {
        success: true,
        data: {
          teams,
          competitions,
          players
        }
      };
    } catch (error: any) {
      logger.error('Get user favorites error', error);
      throw error;
    }
  },
  
  // Get user's favorite teams
  getFavoriteTeams: async (userId: string) => {
    try {
      logger.info('Fetching favorite teams from Supabase', { userId });
      
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'team');
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: favorites
      };
    } catch (error: any) {
      logger.error('Get favorite teams error', error);
      throw error;
    }
  },
  
  // Add favorite team
  addFavoriteTeam: async (userId: string, teamId: string) => {
    try {
      logger.info('Adding favorite team to Supabase', { userId, teamId });
      
      // Check if already favorited
      const { data: existing, error: existingError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'team')
        .eq('entity_id', teamId)
        .maybeSingle();
      
      if (existingError) {
        throw new Error(`Supabase error: ${existingError.message}`);
      }
      
      if (existing) {
        return {
          success: true,
          data: existing
        };
      }
      
      // Add favorite to Supabase
      const { data: favorite, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          entity_type: 'team',
          entity_id: teamId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: favorite
      };
    } catch (error: any) {
      logger.error('Add favorite team error', error);
      throw error;
    }
  },
  
  // Remove favorite team
  removeFavoriteTeam: async (userId: string, teamId: string) => {
    try {
      logger.info('Removing favorite team from Supabase', { userId, teamId });
      
      // Find and remove the favorite
      const { data: removed, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', 'team')
        .eq('entity_id', teamId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!removed) {
        throw new Error('Favorite not found');
      }
      
      return {
        success: true,
        data: removed
      };
    } catch (error: any) {
      logger.error('Remove favorite team error', error);
      throw error;
    }
  },
  
  // Get user's favorite competitions
  getFavoriteCompetitions: async (userId: string) => {
    try {
      logger.info('Fetching favorite competitions from Supabase', { userId });
      
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'competition');
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: favorites
      };
    } catch (error: any) {
      logger.error('Get favorite competitions error', error);
      throw error;
    }
  },
  
  // Add favorite competition
  addFavoriteCompetition: async (userId: string, competitionId: string) => {
    try {
      logger.info('Adding favorite competition to Supabase', { userId, competitionId });
      
      // Check if already favorited
      const { data: existing, error: existingError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'competition')
        .eq('entity_id', competitionId)
        .maybeSingle();
      
      if (existingError) {
        throw new Error(`Supabase error: ${existingError.message}`);
      }
      
      if (existing) {
        return {
          success: true,
          data: existing
        };
      }
      
      // Add favorite to Supabase
      const { data: favorite, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          entity_type: 'competition',
          entity_id: competitionId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: favorite
      };
    } catch (error: any) {
      logger.error('Add favorite competition error', error);
      throw error;
    }
  },
  
  // Remove favorite competition
  removeFavoriteCompetition: async (userId: string, competitionId: string) => {
    try {
      logger.info('Removing favorite competition from Supabase', { userId, competitionId });
      
      // Find and remove the favorite
      const { data: removed, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', 'competition')
        .eq('entity_id', competitionId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!removed) {
        throw new Error('Favorite not found');
      }
      
      return {
        success: true,
        data: removed
      };
    } catch (error: any) {
      logger.error('Remove favorite competition error', error);
      throw error;
    }
  },
  
  // Get user's followed players
  getFollowedPlayers: async (userId: string) => {
    try {
      logger.info('Fetching followed players from Supabase', { userId });
      
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'player');
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: favorites
      };
    } catch (error: any) {
      logger.error('Get followed players error', error);
      throw error;
    }
  },
  
  // Follow player
  followPlayer: async (userId: string, playerId: string) => {
    try {
      logger.info('Following player in Supabase', { userId, playerId });
      
      // Check if already followed
      const { data: existing, error: existingError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('entity_type', 'player')
        .eq('entity_id', playerId)
        .maybeSingle();
      
      if (existingError) {
        throw new Error(`Supabase error: ${existingError.message}`);
      }
      
      if (existing) {
        return {
          success: true,
          data: existing
        };
      }
      
      // Add follow to Supabase
      const { data: follow, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          entity_type: 'player',
          entity_id: playerId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: follow
      };
    } catch (error: any) {
      logger.error('Follow player error', error);
      throw error;
    }
  },
  
  // Unfollow player
  unfollowPlayer: async (userId: string, playerId: string) => {
    try {
      logger.info('Unfollowing player in Supabase', { userId, playerId });
      
      // Find and remove the follow
      const { data: removed, error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', 'player')
        .eq('entity_id', playerId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!removed) {
        throw new Error('Follow not found');
      }
      
      return {
        success: true,
        data: removed
      };
    } catch (error: any) {
      logger.error('Unfollow player error', error);
      throw error;
    }
  },
  
  // Add favorite (generic method that handles all types)
  addFavorite: async (userId: string, favoriteType: string, favoriteId: string) => {
    try {
      logger.info('Adding favorite to Supabase', { userId, favoriteType, favoriteId });
      
      switch (favoriteType) {
        case 'team':
          return await favoritesService.addFavoriteTeam(userId, favoriteId);
        case 'competition':
          return await favoritesService.addFavoriteCompetition(userId, favoriteId);
        case 'player':
          return await favoritesService.followPlayer(userId, favoriteId);
        default:
          throw new Error('Invalid favorite type');
      }
    } catch (error: any) {
      logger.error('Add favorite error', error);
      throw error;
    }
  },
  
  // Remove favorite (generic method that handles all types)
  removeFavorite: async (userId: string, favoriteType: string, favoriteId: string) => {
    try {
      logger.info('Removing favorite from Supabase', { userId, favoriteType, favoriteId });
      
      switch (favoriteType) {
        case 'team':
          return await favoritesService.removeFavoriteTeam(userId, favoriteId);
        case 'competition':
          return await favoritesService.removeFavoriteCompetition(userId, favoriteId);
        case 'player':
          return await favoritesService.unfollowPlayer(userId, favoriteId);
        default:
          throw new Error('Invalid favorite type');
      }
    } catch (error: any) {
      logger.error('Remove favorite error', error);
      throw error;
    }
  }
};