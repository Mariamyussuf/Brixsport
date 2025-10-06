import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { matchEventRules } from '../services/matchEventRules.service';
import { validate, validationSchemas } from '../middleware';
import { errorHandlerService } from '../services/error.handler.service';

// Mock database
const matchEvents: any[] = [];

export const matchEventController = {
  // Create a new match event
  createEvent: async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      
      logger.info('Creating match event', { eventData });
      
      // First, validate the basic structure using Zod
      const validatedData = validationSchemas.createEvent.parse(eventData);
      
      // Then apply business rules based on event type
      let validationErrors: string[] = [];
      
      switch (eventData.eventType) {
        case 'goal':
        case 'own_goal':
          validationErrors = matchEventRules.validateGoalEvent(eventData);
          break;
        case 'yellow_card':
        case 'red_card':
          validationErrors = matchEventRules.validateCardEvent(eventData);
          break;
        case 'substitution':
          validationErrors = matchEventRules.validateSubstitutionEvent(eventData);
          break;
        case 'VAR_review':
          validationErrors = matchEventRules.validateVARReviewEvent(eventData);
          break;
        default:
          // For other event types, basic validation is sufficient
          break;
      }
      
      // If there are validation errors, return them
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Business rule validation failed',
          details: validationErrors
        });
      }
      
      // Create the event
      const newEvent = {
        id: Date.now().toString(),
        ...validatedData,
        createdAt: new Date()
      };
      
      matchEvents.push(newEvent);
      
      logger.info('Match event created successfully', { eventId: newEvent.id });
      
      return res.status(201).json({
        success: true,
        data: newEvent
      });
    } catch (error: any) {
      logger.error('Create match event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get all events for a match
  getMatchEvents: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      
      logger.info('Fetching match events', { matchId });
      
      const events = matchEvents.filter(e => e.matchId === matchId);
      
      // Validate chronology of events
      const chronologyErrors = matchEventRules.validateEventChronology(events);
      if (chronologyErrors.length > 0) {
        logger.warn('Chronology issues found', { matchId, issues: chronologyErrors });
      }
      
      return res.status(200).json({
        success: true,
        data: events,
        warnings: chronologyErrors.length > 0 ? chronologyErrors : undefined
      });
    } catch (error: any) {
      logger.error('Get match events error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update a match event
  updateEvent: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const updateData = req.body;
      
      logger.info('Updating match event', { eventId, updateData });
      
      const eventIndex = matchEvents.findIndex(e => e.id === eventId);
      if (eventIndex === -1) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      
      // Apply the same validation rules as for creation
      let validationErrors: string[] = [];
      
      if (updateData.eventType) {
        switch (updateData.eventType) {
          case 'goal':
          case 'own_goal':
            validationErrors = matchEventRules.validateGoalEvent(updateData);
            break;
          case 'yellow_card':
          case 'red_card':
            validationErrors = matchEventRules.validateCardEvent(updateData);
            break;
          case 'substitution':
            validationErrors = matchEventRules.validateSubstitutionEvent(updateData);
            break;
          case 'VAR_review':
            validationErrors = matchEventRules.validateVARReviewEvent(updateData);
            break;
        }
      }
      
      // If there are validation errors, return them
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Business rule validation failed',
          details: validationErrors
        });
      }
      
      // Update the event
      matchEvents[eventIndex] = {
        ...matchEvents[eventIndex],
        ...updateData,
        updatedAt: new Date()
      };
      
      logger.info('Match event updated successfully', { eventId });
      
      return res.status(200).json({
        success: true,
        data: matchEvents[eventIndex]
      });
    } catch (error: any) {
      logger.error('Update match event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Delete a match event
  deleteEvent: async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      logger.info('Deleting match event', { eventId });
      
      const eventIndex = matchEvents.findIndex(e => e.id === eventId);
      if (eventIndex === -1) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      
      matchEvents.splice(eventIndex, 1);
      
      logger.info('Match event deleted successfully', { eventId });
      
      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete match event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};