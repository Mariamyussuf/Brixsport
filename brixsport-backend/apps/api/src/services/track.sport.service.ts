import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from './error.handler.service';
import { supabase } from './supabase.service';

interface TrackEvent {
  id?: string;
  name: string;
  description?: string;
  startTime: string;
  venue?: string;
  status: string;
  sport: 'track';
  competitionId?: string;
  gender?: string;
}

interface TrackResult {
  id?: string;
  matchId: string;
  position: number;
  teamId?: string | null;
  teamName?: string | null;
  athleteName: string;
  time?: string | null;
  distance?: number | null;
}

export const trackService = {
  // Get event details
  getEventDetails: async (eventId: string) => {
    try {
      logger.info('Fetching track event details', { eventId });
      
      const { data: event, error } = await supabase
        .from('"Match"')
        .select(`
          *,
          competition:Competition(name)
        `)
        .eq('id', eventId)
        .eq('sport', 'track')
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!event) {
        throw new NotFoundError('Track event not found');
      }
      
      return {
        success: true,
        data: event
      };
    } catch (error: any) {
      logger.error('Get track event details error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  // Create a new track event
  createEvent: async (eventData: Omit<TrackEvent, 'id' | 'sport'>) => {
    try {
      logger.info('Creating new track event', { eventData });
      
      const trackEvent: TrackEvent = {
        ...eventData,
        sport: 'track',
        status: eventData.status || 'scheduled'
      };
      
      const { data, error } = await supabase
        .from('"Match"')
        .insert(trackEvent)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      logger.error('Create track event error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  // Update an existing track event
  updateEvent: async (eventId: string, eventData: Partial<Omit<TrackEvent, 'id' | 'sport'>>) => {
    try {
      logger.info('Updating track event', { eventId, eventData });
      
      const updateData: Partial<TrackEvent> = { ...eventData };
      
      const { data, error } = await supabase
        .from('"Match"')
        .update(updateData)
        .eq('id', eventId)
        .eq('sport', 'track')
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data) {
        throw new NotFoundError('Track event not found');
      }
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      logger.error('Update track event error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  // Submit results for a track event
  submitResults: async (eventId: string, resultsData: Omit<TrackResult, 'id' | 'matchId'>) => {
    try {
      logger.info('Submitting track event results', { eventId, resultsData });
      
      // Check if the event exists
      const { data: event, error: eventError } = await supabase
        .from('"Match"')
        .select('id')
        .eq('id', eventId)
        .eq('sport', 'track')
        .single();
      
      if (eventError) {
        throw new Error(`Supabase error: ${eventError.message}`);
      }
      
      if (!event) {
        throw new NotFoundError('Track event not found');
      }
      
      // Prepare result data
      const resultData: Omit<TrackResult, 'id'> = {
        matchId: eventId,
        position: resultsData.position,
        teamId: resultsData.teamId || null,
        teamName: resultsData.teamName || null,
        athleteName: resultsData.athleteName,
        time: resultsData.time || null,
        distance: resultsData.distance || null
      };
      
      const { data, error } = await supabase
        .from('TrackResult')
        .insert(resultData)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: {
          id: data.id,
          position: data.position,
          team_id: data.teamId,
          team_name: data.teamName,
          athlete_name: data.athleteName,
          time: data.time,
          distance: data.distance
        }
      };
    } catch (error: any) {
      logger.error('Submit track event results error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  // Update a track event result
  updateResult: async (eventId: string, resultId: string, resultData: Partial<Omit<TrackResult, 'id' | 'matchId'>>) => {
    try {
      logger.info('Updating track event result', { eventId, resultId, resultData });
      
      const updateData: Partial<TrackResult> = {};
      
      if (resultData.position !== undefined) updateData.position = resultData.position;
      if (resultData.teamId !== undefined) updateData.teamId = resultData.teamId;
      if (resultData.teamName !== undefined) updateData.teamName = resultData.teamName;
      if (resultData.athleteName !== undefined) updateData.athleteName = resultData.athleteName;
      if (resultData.time !== undefined) updateData.time = resultData.time;
      if (resultData.distance !== undefined) updateData.distance = resultData.distance;
      
      const { data, error } = await supabase
        .from('TrackResult')
        .update(updateData)
        .eq('id', resultId)
        .eq('matchId', eventId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data) {
        throw new NotFoundError('Result not found');
      }
      
      return {
        success: true,
        data: {
          id: data.id,
          position: data.position,
          team_id: data.teamId,
          team_name: data.teamName,
          athlete_name: data.athleteName,
          time: data.time,
          distance: data.distance
        }
      };
    } catch (error: any) {
      logger.error('Update track event result error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  // Get results for a track event
  getEventResults: async (eventId: string) => {
    try {
      logger.info('Fetching track event results', { eventId });
      
      const { data, error } = await supabase
        .from('TrackResult')
        .select('*')
        .eq('matchId', eventId)
        .order('position', { ascending: true });
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return {
        success: true,
        data: data.map(result => ({
          id: result.id,
          position: result.position,
          team_id: result.teamId,
          team_name: result.teamName,
          athlete_name: result.athleteName,
          time: result.time,
          distance: result.distance
        }))
      };
    } catch (error: any) {
      logger.error('Get track event results error', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
};