import { Request, Response, NextFunction } from 'express';

// Validation rules for getting player statistics
export const getPlayerStatisticsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: playerId } = req.params;
      
      if (!isValidUUID(playerId)) {
        errors.push({ field: 'id', message: 'Player ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting player trends
export const getPlayerTrendsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: playerId } = req.params;
      const { period, limit } = req.query;
      
      if (!isValidUUID(playerId)) {
        errors.push({ field: 'id', message: 'Player ID must be a valid UUID' });
      }
      
      // Validate period
      if (period && !['DAILY', 'WEEKLY', 'MONTHLY', 'SEASON'].includes(period as string)) {
        errors.push({ field: 'period', message: 'Period must be one of: DAILY, WEEKLY, MONTHLY, SEASON' });
      }
      
      // Validate limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
          errors.push({ field: 'limit', message: 'Limit must be between 1 and 50' });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for comparing players
export const comparePlayersValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: playerId } = req.params;
      const { compareWith, metrics } = req.query;
      
      if (!isValidUUID(playerId)) {
        errors.push({ field: 'id', message: 'Player ID must be a valid UUID' });
      }
      
      // Validate compareWith
      if (!compareWith) {
        errors.push({ field: 'compareWith', message: 'compareWith query parameter is required' });
      } else if (compareWith !== 'league_average' && typeof compareWith !== 'string') {
        errors.push({ field: 'compareWith', message: 'compareWith must be "league_average" or a comma-separated list of player IDs' });
      }
      
      // Validate metrics
      if (metrics && typeof metrics !== 'string') {
        errors.push({ field: 'metrics', message: 'metrics must be a comma-separated list of metric names' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting team statistics
export const getTeamStatisticsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: teamId } = req.params;
      
      if (!isValidUUID(teamId)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting team trends
export const getTeamTrendsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: teamId } = req.params;
      const { period, limit } = req.query;
      
      if (!isValidUUID(teamId)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      // Validate period
      if (period && !['DAILY', 'WEEKLY', 'MONTHLY', 'SEASON'].includes(period as string)) {
        errors.push({ field: 'period', message: 'Period must be one of: DAILY, WEEKLY, MONTHLY, SEASON' });
      }
      
      // Validate limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
          errors.push({ field: 'limit', message: 'Limit must be between 1 and 50' });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for comparing teams
export const compareTeamsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: teamId } = req.params;
      const { compareWith, metrics } = req.query;
      
      if (!isValidUUID(teamId)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      // Validate compareWith
      if (!compareWith) {
        errors.push({ field: 'compareWith', message: 'compareWith query parameter is required' });
      } else if (compareWith !== 'league_average' && typeof compareWith !== 'string') {
        errors.push({ field: 'compareWith', message: 'compareWith must be "league_average" or a comma-separated list of team IDs' });
      }
      
      // Validate metrics
      if (metrics && typeof metrics !== 'string') {
        errors.push({ field: 'metrics', message: 'metrics must be a comma-separated list of metric names' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting competition statistics
export const getCompetitionStatisticsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: competitionId } = req.params;
      
      if (!isValidUUID(competitionId)) {
        errors.push({ field: 'id', message: 'Competition ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting competition standings
export const getCompetitionStandingsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: competitionId } = req.params;
      const { sortBy, sortOrder } = req.query;
      
      if (!isValidUUID(competitionId)) {
        errors.push({ field: 'id', message: 'Competition ID must be a valid UUID' });
      }
      
      // Validate sortBy
      if (sortBy && typeof sortBy !== 'string') {
        errors.push({ field: 'sortBy', message: 'sortBy must be a valid field name' });
      }
      
      // Validate sortOrder
      if (sortOrder && !['ASC', 'DESC'].includes(sortOrder as string)) {
        errors.push({ field: 'sortOrder', message: 'sortOrder must be one of: ASC, DESC' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting top performers
export const getTopPerformersValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: competitionId } = req.params;
      const { category, limit } = req.query;
      
      if (!isValidUUID(competitionId)) {
        errors.push({ field: 'id', message: 'Competition ID must be a valid UUID' });
      }
      
      // Validate category
      if (!category) {
        errors.push({ field: 'category', message: 'category query parameter is required' });
      } else if (typeof category !== 'string') {
        errors.push({ field: 'category', message: 'category must be a valid category name' });
      }
      
      // Validate limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
          errors.push({ field: 'limit', message: 'Limit must be between 1 and 50' });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting player analytics report
export const getPlayerAnalyticsReportValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: playerId } = req.params;
      const { timeRange, startDate, endDate } = req.query;
      
      if (!isValidUUID(playerId)) {
        errors.push({ field: 'id', message: 'Player ID must be a valid UUID' });
      }
      
      // Validate timeRange
      if (timeRange && !['week', 'month', 'season', 'custom'].includes(timeRange as string)) {
        errors.push({ field: 'timeRange', message: 'timeRange must be one of: week, month, season, custom' });
      }
      
      // Validate startDate
      if (startDate && typeof startDate === 'string') {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'startDate', message: 'startDate must be a valid date' });
        }
      }
      
      // Validate endDate
      if (endDate && typeof endDate === 'string') {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'endDate', message: 'endDate must be a valid date' });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for getting team analytics report
export const getTeamAnalyticsReportValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id: teamId } = req.params;
      const { timeRange, startDate, endDate } = req.query;
      
      if (!isValidUUID(teamId)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      // Validate timeRange
      if (timeRange && !['week', 'month', 'season', 'custom'].includes(timeRange as string)) {
        errors.push({ field: 'timeRange', message: 'timeRange must be one of: week, month, season, custom' });
      }
      
      // Validate startDate
      if (startDate && typeof startDate === 'string') {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'startDate', message: 'startDate must be a valid date' });
        }
      }
      
      // Validate endDate
      if (endDate && typeof endDate === 'string') {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'endDate', message: 'endDate must be a valid date' });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Validation rules for comparing entities
export const compareEntitiesValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { type, ids, metrics } = req.body;
      
      // Validate type
      if (!type) {
        errors.push({ field: 'type', message: 'type is required' });
      } else if (!['PLAYER', 'TEAM', 'COMPETITION'].includes(type)) {
        errors.push({ field: 'type', message: 'type must be one of: PLAYER, TEAM, COMPETITION' });
      }
      
      // Validate ids
      if (!ids) {
        errors.push({ field: 'ids', message: 'ids is required' });
      } else if (!Array.isArray(ids) || ids.length < 2) {
        errors.push({ field: 'ids', message: 'ids must be an array with at least 2 elements' });
      } else {
        for (const id of ids) {
          if (!isValidUUID(id)) {
            errors.push({ field: 'ids', message: 'All IDs in the array must be valid UUIDs' });
            break;
          }
        }
      }
      
      // Validate metrics
      if (!metrics) {
        errors.push({ field: 'metrics', message: 'metrics is required' });
      } else if (!Array.isArray(metrics) || metrics.length === 0) {
        errors.push({ field: 'metrics', message: 'metrics must be a non-empty array' });
      } else {
        for (const metric of metrics) {
          if (typeof metric !== 'string') {
            errors.push({ field: 'metrics', message: 'All metrics must be strings' });
            break;
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
          },
        });
      }
      
      next();
    }
  ];
};

// Helper function to validate UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};