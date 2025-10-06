import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

interface TrackEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  eventType: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface TrackResult {
  id: string;
  eventId: string;
  participantId: string;
  participantName: string;
  resultValue: number;
  unit: string;
  position?: number;
  submittedAt: string;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export const trackService = {
  // List track events
  listEvents: async (filters: any = {}) => {
    try {
      logger.info('Listing track events', { filters });
      
      // Use the listTrackEvents method from supabaseService
      const response = await supabaseService.listTrackEvents(filters);
      
      if (!response.success) {
        throw new Error('Failed to fetch track events');
      }
      
      return {
        success: true,
        data: (response.data || []).map((event: any) => ({
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          eventType: event.event_type,
          status: event.status,
          description: event.description,
          createdAt: event.created_at,
          updatedAt: event.updated_at
        }))
      };
    } catch (error: any) {
      logger.error('Error listing track events', { error });
      return {
        success: false,
        error: error.message || 'Failed to list track events'
      };
    }
  },

  // Get track event details
  getEvent: async (eventId: string) => {
    try {
      logger.info('Fetching track event details', { eventId });

      const response = await supabaseService.getTrackEvent(eventId);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Track event not found'
        };
      }

      const eventData = response.data;
      return {
        success: true,
        data: {
          id: eventData.id,
          name: eventData.name,
          date: eventData.date,
          location: eventData.location,
          eventType: eventData.event_type,
          status: eventData.status,
          description: eventData.description,
          createdAt: eventData.created_at,
          updatedAt: eventData.updated_at
        }
      };
    } catch (error: any) {
      logger.error('Get track event error', error);
      return {
        success: false,
        error: error.message || 'Failed to get track event'
      };
    }
  },

  // Get track event results
  getEventResults: async (eventId: string) => {
    try {
      logger.info('Fetching track event results', { eventId });

      const response = await supabaseService.listTrackResults({ eventId });
      
      if (!response.success) {
        throw new Error('Failed to fetch track event results');
      }
      
      return {
        success: true,
        data: (response.data || []).map((result: any) => ({
          id: result.id,
          eventId: result.event_id,
          participantId: result.participant_id,
          participantName: result.participant_name,
          resultValue: result.result_value,
          unit: result.unit,
          position: result.position,
          submittedAt: result.submitted_at,
          createdAt: result.created_at,
          updatedAt: result.updated_at
        }))
      };
    } catch (error: any) {
      logger.error('Get track event results error', error);
      return {
        success: false,
        error: error.message || 'Failed to get track event results'
      };
    }
  },

  // Create track event (admin)
  createEvent: async (eventData: any) => {
    try {
      // Validate required fields
      if (!eventData.name) {
        throw new Error('Event name is required');
      }

      if (!eventData.date) {
        throw new Error('Event date is required');
      }

      if (!eventData.location) {
        throw new Error('Event location is required');
      }

      if (!eventData.eventType) {
        throw new Error('Event type is required');
      }

      logger.info('Creating track event', { eventData });

      const response = await supabaseService.createTrackEvent({
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
        event_type: eventData.eventType,
        status: eventData.status || 'planned',
        description: eventData.description || null
      });

      if (!response.success) {
        throw new Error('Failed to create track event');
      }

      const createdEvent = response.data;
      return {
        success: true,
        data: {
          id: createdEvent.id,
          name: createdEvent.name,
          date: createdEvent.date,
          location: createdEvent.location,
          eventType: createdEvent.event_type,
          status: createdEvent.status,
          description: createdEvent.description,
          createdAt: createdEvent.created_at,
          updatedAt: createdEvent.updated_at
        }
      };
    } catch (error: any) {
      logger.error('Create track event error', error);
      return {
        success: false,
        error: error.message || 'Failed to create track event'
      };
    }
  },

  // Update track event (admin)
  updateEvent: async (eventId: string, eventData: any) => {
    try {
      logger.info('Updating track event', { eventId, eventData });

      // Validate date format if provided
      if (eventData.date) {
        const date = new Date(eventData.date);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)');
        }
      }

      // Validate status if provided
      if (eventData.status && !['planned', 'in_progress', 'completed', 'cancelled'].includes(eventData.status)) {
        throw new Error('Invalid status. Must be one of: planned, in_progress, completed, cancelled');
      }

      // Prepare update data with proper field mapping
      const updateData: any = {};
      
      // Map fields to match database schema
      if (eventData.name !== undefined) updateData.name = eventData.name;
      if (eventData.date !== undefined) updateData.date = eventData.date;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.eventType !== undefined) updateData.event_type = eventData.eventType;
      if (eventData.status !== undefined) updateData.status = eventData.status;
      if (eventData.description !== undefined) updateData.description = eventData.description;

      // If there's nothing to update, return early
      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          data: { id: eventId, ...eventData }
        };
      }

      logger.debug('Updating track event with data', { eventId, updateData });

      const response = await supabaseService.updateTrackEvent(eventId, updateData);

      if (!response.success) {
        throw new Error('Failed to update track event');
      }

      const updatedEvent = response.data;
      return {
        success: true,
        data: {
          id: updatedEvent.id,
          name: updatedEvent.name,
          date: updatedEvent.date,
          location: updatedEvent.location,
          eventType: updatedEvent.event_type,
          status: updatedEvent.status,
          description: updatedEvent.description,
          createdAt: updatedEvent.created_at,
          updatedAt: updatedEvent.updated_at
        }
      };
    } catch (error: any) {
      logger.error('Update track event error', error);
      return {
        success: false,
        error: error.message || 'Failed to update track event'
      };
    }
  },

  // Submit results (logger)
  submitResults: async (eventId: string, resultsData: any) => {
    try {
      // Validate required fields
      if (!resultsData.participantId) {
        throw new Error('Participant ID is required');
      }

      if (resultsData.resultValue === undefined || resultsData.resultValue === null) {
        throw new Error('Result value is required');
      }

      if (!resultsData.unit) {
        throw new Error('Unit is required (e.g., seconds, meters)');
      }

      logger.info('Submitting track results', { eventId, resultsData });

      const response = await supabaseService.createTrackResult({
        event_id: eventId,
        participant_id: resultsData.participantId,
        participant_name: resultsData.participantName || `Participant ${resultsData.participantId}`,
        result_value: parseFloat(resultsData.resultValue),
        unit: resultsData.unit,
        position: resultsData.position || null,
        notes: resultsData.notes || null
      });

      if (!response.success) {
        throw new Error('Failed to submit track results');
      }

      const createdResult = response.data;
      return {
        success: true,
        data: {
          id: createdResult.id,
          eventId: createdResult.event_id,
          participantId: createdResult.participant_id,
          participantName: createdResult.participant_name,
          resultValue: createdResult.result_value,
          unit: createdResult.unit,
          position: createdResult.position,
          notes: createdResult.notes,
          submittedAt: createdResult.submitted_at,
          createdAt: createdResult.created_at,
          updatedAt: createdResult.updated_at
        }
      };
    } catch (error: any) {
      logger.error('Submit track event results error', error);
      return {
        success: false,
        error: error.message || 'Failed to submit track results'
      };
    }
  },

  // Update result
  updateResult: async (eventId: string, resultId: string, resultData: any) => {
    try {
      logger.info('Updating track event result', { eventId, resultId, resultData });

      // Validate result value if provided
      if (resultData.resultValue !== undefined && isNaN(parseFloat(resultData.resultValue))) {
        throw new Error('Result value must be a valid number');
      }

      // Prepare update data with proper field mapping
      const updateData: any = {};
      
      // Map fields to match database schema
      if (resultData.resultValue !== undefined) updateData.result_value = parseFloat(resultData.resultValue);
      if (resultData.unit !== undefined) updateData.unit = resultData.unit;
      if (resultData.position !== undefined) updateData.position = resultData.position;
      if (resultData.notes !== undefined) updateData.notes = resultData.notes;
      if (resultData.participantName !== undefined) updateData.participant_name = resultData.participantName;

      // If there's nothing to update, return early
      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          data: { id: resultId, ...resultData }
        };
      }

      const response = await supabaseService.updateTrackResult(resultId, updateData);

      if (!response.success) {
        throw new Error('Failed to update track result');
      }

      const updatedResult = response.data;
      return {
        success: true,
        data: {
          id: updatedResult.id,
          eventId: updatedResult.event_id,
          participantId: updatedResult.participant_id,
          participantName: updatedResult.participant_name,
          resultValue: updatedResult.result_value,
          unit: updatedResult.unit,
          position: updatedResult.position,
          notes: updatedResult.notes,
          submittedAt: updatedResult.submitted_at,
          createdAt: updatedResult.created_at,
          updatedAt: updatedResult.updated_at
        }
      };
    } catch (error: any) {
      logger.error('Update track event result error', error);
      return {
        success: false,
        error: error.message || 'Failed to update track result'
      };
    }
  }
};