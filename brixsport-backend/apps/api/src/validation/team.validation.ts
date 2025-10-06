import { Request, Response, NextFunction } from 'express';

// Validation rules for creating/updating a team
export const teamValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      
      const { name, description, foundedYear, logoUrl, stadium, city, country, 
              colorPrimary, colorSecondary, sport, websiteUrl, socialMediaLinks, coachName } = req.body;
      
      // Validate name
      if (!name) {
        errors.push({ field: 'name', message: 'Team name is required' });
      } else if (typeof name !== 'string' || name.length > 100) {
        errors.push({ field: 'name', message: 'Team name must be less than 100 characters' });
      }
      
      // Validate description
      if (description && (typeof description !== 'string' || description.length > 500)) {
        errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
      }
      
      // Validate foundedYear
      if (foundedYear !== undefined) {
        const year = parseInt(foundedYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
          errors.push({ field: 'foundedYear', message: 'Founded year must be a valid year' });
        }
      }
      
      // Validate logoUrl
      if (logoUrl && (typeof logoUrl !== 'string' || !isValidUrl(logoUrl))) {
        errors.push({ field: 'logoUrl', message: 'Logo URL must be a valid URL' });
      }
      
      // Validate stadium
      if (stadium && (typeof stadium !== 'string' || stadium.length > 100)) {
        errors.push({ field: 'stadium', message: 'Stadium name must be less than 100 characters' });
      }
      
      // Validate city
      if (!city) {
        errors.push({ field: 'city', message: 'City is required' });
      } else if (typeof city !== 'string' || city.length > 100) {
        errors.push({ field: 'city', message: 'City must be less than 100 characters' });
      }
      
      // Validate country
      if (!country) {
        errors.push({ field: 'country', message: 'Country is required' });
      } else if (typeof country !== 'string' || country.length !== 2) {
        errors.push({ field: 'country', message: 'Country must be a valid ISO 3166-1 alpha-2 code' });
      }
      
      // Validate colorPrimary
      if (!colorPrimary) {
        errors.push({ field: 'colorPrimary', message: 'Primary color is required' });
      } else if (typeof colorPrimary !== 'string' || !isValidHexColor(colorPrimary)) {
        errors.push({ field: 'colorPrimary', message: 'Primary color must be a valid HEX color code' });
      }
      
      // Validate colorSecondary
      if (!colorSecondary) {
        errors.push({ field: 'colorSecondary', message: 'Secondary color is required' });
      } else if (typeof colorSecondary !== 'string' || !isValidHexColor(colorSecondary)) {
        errors.push({ field: 'colorSecondary', message: 'Secondary color must be a valid HEX color code' });
      }
      
      // Validate sport
      if (!sport) {
        errors.push({ field: 'sport', message: 'Sport is required' });
      } else if (!['FOOTBALL', 'BASKETBALL', 'TRACK'].includes(sport)) {
        errors.push({ field: 'sport', message: 'Sport must be one of: FOOTBALL, BASKETBALL, TRACK' });
      }
      
      // Validate websiteUrl
      if (websiteUrl && (typeof websiteUrl !== 'string' || !isValidUrl(websiteUrl))) {
        errors.push({ field: 'websiteUrl', message: 'Website URL must be a valid URL' });
      }
      
      // Validate socialMediaLinks
      if (socialMediaLinks) {
        if (socialMediaLinks.twitter && !isValidUrl(socialMediaLinks.twitter)) {
          errors.push({ field: 'socialMediaLinks.twitter', message: 'Twitter URL must be a valid URL' });
        }
        if (socialMediaLinks.instagram && !isValidUrl(socialMediaLinks.instagram)) {
          errors.push({ field: 'socialMediaLinks.instagram', message: 'Instagram URL must be a valid URL' });
        }
        if (socialMediaLinks.facebook && !isValidUrl(socialMediaLinks.facebook)) {
          errors.push({ field: 'socialMediaLinks.facebook', message: 'Facebook URL must be a valid URL' });
        }
      }
      
      // Validate coachName
      if (coachName && (typeof coachName !== 'string' || coachName.length > 100)) {
        errors.push({ field: 'coachName', message: 'Coach name must be less than 100 characters' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for adding a player to a team
export const addPlayerValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id } = req.params;
      const { playerId } = req.body;
      
      if (!isValidUUID(id)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      if (!playerId || !isValidUUID(playerId)) {
        errors.push({ field: 'playerId', message: 'Player ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for removing a player from a team
export const removePlayerValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id, playerId } = req.params;
      
      if (!isValidUUID(id)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      if (!isValidUUID(playerId)) {
        errors.push({ field: 'playerId', message: 'Player ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for getting teams with pagination and filters
export const getTeamsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { page, limit, sport, status, search, sortBy, sortOrder } = req.query;
      
      // Validate page
      if (page !== undefined) {
        const pageNum = parseInt(page as string);
        if (isNaN(pageNum) || pageNum < 1) {
          errors.push({ field: 'page', message: 'Page must be a positive integer' });
        }
      }
      
      // Validate limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
        }
      }
      
      // Validate sport
      if (sport && !['FOOTBALL', 'BASKETBALL', 'TRACK'].includes(sport as string)) {
        errors.push({ field: 'sport', message: 'Sport must be one of: FOOTBALL, BASKETBALL, TRACK' });
      }
      
      // Validate status
      if (status && !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status as string)) {
        errors.push({ field: 'status', message: 'Status must be one of: ACTIVE, INACTIVE, SUSPENDED' });
      }
      
      // Validate search
      if (search && (typeof search !== 'string' || search.length > 100)) {
        errors.push({ field: 'search', message: 'Search query must be less than 100 characters' });
      }
      
      // Validate sortBy
      if (sortBy && !['name', 'city', 'foundedYear'].includes(sortBy as string)) {
        errors.push({ field: 'sortBy', message: 'Sort by must be one of: name, city, foundedYear' });
      }
      
      // Validate sortOrder
      if (sortOrder && !['ASC', 'DESC'].includes(sortOrder as string)) {
        errors.push({ field: 'sortOrder', message: 'Sort order must be one of: ASC, DESC' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for getting matches with pagination
export const getMatchesValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id } = req.params;
      const { page, limit, status, competitionId } = req.query;
      
      if (!isValidUUID(id)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      // Validate page
      if (page !== undefined) {
        const pageNum = parseInt(page as string);
        if (isNaN(pageNum) || pageNum < 1) {
          errors.push({ field: 'page', message: 'Page must be a positive integer' });
        }
      }
      
      // Validate limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
        }
      }
      
      // Validate status
      if (status && !['SCHEDULED', 'LIVE', 'COMPLETED', 'POSTPONED', 'CANCELLED'].includes(status as string)) {
        errors.push({ field: 'status', message: 'Status must be a valid match status' });
      }
      
      // Validate competitionId
      if (competitionId && !isValidUUID(competitionId as string)) {
        errors.push({ field: 'competitionId', message: 'Competition ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for searching teams
export const searchTeamsValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { q, sports, countries, minFoundedYear, maxFoundedYear } = req.query;
      
      // Validate search query
      if (q && (typeof q !== 'string' || q.length > 100)) {
        errors.push({ field: 'q', message: 'Search query must be less than 100 characters' });
      }
      
      // Validate sports
      if (sports) {
        const sportList = (sports as string).split(',');
        for (const sport of sportList) {
          if (!['FOOTBALL', 'BASKETBALL', 'TRACK'].includes(sport.trim())) {
            errors.push({ field: 'sports', message: 'Each sport must be one of: FOOTBALL, BASKETBALL, TRACK' });
            break;
          }
        }
      }
      
      // Validate countries
      if (countries) {
        const countryList = (countries as string).split(',');
        for (const country of countryList) {
          if (country.trim().length !== 2) {
            errors.push({ field: 'countries', message: 'Each country must be a valid ISO 3166-1 alpha-2 code' });
            break;
          }
        }
      }
      
      // Validate minFoundedYear
      if (minFoundedYear !== undefined) {
        const year = parseInt(minFoundedYear as string);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
          errors.push({ field: 'minFoundedYear', message: 'Min founded year must be a valid year' });
        }
      }
      
      // Validate maxFoundedYear
      if (maxFoundedYear !== undefined) {
        const year = parseInt(maxFoundedYear as string);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
          errors.push({ field: 'maxFoundedYear', message: 'Max founded year must be a valid year' });
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for getting a specific team
export const getTeamValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for updating a team
export const updateTeamValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id } = req.params;
      const { name, description, foundedYear, logoUrl, stadium, city, country, 
              colorPrimary, colorSecondary, sport, websiteUrl, socialMediaLinks, coachName } = req.body;
      
      if (!isValidUUID(id)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      // Validate name
      if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
        errors.push({ field: 'name', message: 'Team name must be less than 100 characters' });
      }
      
      // Validate description
      if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
        errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
      }
      
      // Validate foundedYear
      if (foundedYear !== undefined) {
        const year = parseInt(foundedYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear) {
          errors.push({ field: 'foundedYear', message: 'Founded year must be a valid year' });
        }
      }
      
      // Validate logoUrl
      if (logoUrl !== undefined && (typeof logoUrl !== 'string' || !isValidUrl(logoUrl))) {
        errors.push({ field: 'logoUrl', message: 'Logo URL must be a valid URL' });
      }
      
      // Validate stadium
      if (stadium !== undefined && (typeof stadium !== 'string' || stadium.length > 100)) {
        errors.push({ field: 'stadium', message: 'Stadium name must be less than 100 characters' });
      }
      
      // Validate city
      if (city !== undefined && (typeof city !== 'string' || city.length > 100)) {
        errors.push({ field: 'city', message: 'City must be less than 100 characters' });
      }
      
      // Validate country
      if (country !== undefined && (typeof country !== 'string' || country.length !== 2)) {
        errors.push({ field: 'country', message: 'Country must be a valid ISO 3166-1 alpha-2 code' });
      }
      
      // Validate colorPrimary
      if (colorPrimary !== undefined && (typeof colorPrimary !== 'string' || !isValidHexColor(colorPrimary))) {
        errors.push({ field: 'colorPrimary', message: 'Primary color must be a valid HEX color code' });
      }
      
      // Validate colorSecondary
      if (colorSecondary !== undefined && (typeof colorSecondary !== 'string' || !isValidHexColor(colorSecondary))) {
        errors.push({ field: 'colorSecondary', message: 'Secondary color must be a valid HEX color code' });
      }
      
      // Validate sport
      if (sport !== undefined && !['FOOTBALL', 'BASKETBALL', 'TRACK'].includes(sport)) {
        errors.push({ field: 'sport', message: 'Sport must be one of: FOOTBALL, BASKETBALL, TRACK' });
      }
      
      // Validate websiteUrl
      if (websiteUrl !== undefined && (typeof websiteUrl !== 'string' || !isValidUrl(websiteUrl))) {
        errors.push({ field: 'websiteUrl', message: 'Website URL must be a valid URL' });
      }
      
      // Validate socialMediaLinks
      if (socialMediaLinks !== undefined) {
        if (socialMediaLinks.twitter && !isValidUrl(socialMediaLinks.twitter)) {
          errors.push({ field: 'socialMediaLinks.twitter', message: 'Twitter URL must be a valid URL' });
        }
        if (socialMediaLinks.instagram && !isValidUrl(socialMediaLinks.instagram)) {
          errors.push({ field: 'socialMediaLinks.instagram', message: 'Instagram URL must be a valid URL' });
        }
        if (socialMediaLinks.facebook && !isValidUrl(socialMediaLinks.facebook)) {
          errors.push({ field: 'socialMediaLinks.facebook', message: 'Facebook URL must be a valid URL' });
        }
      }
      
      // Validate coachName
      if (coachName !== undefined && (typeof coachName !== 'string' || coachName.length > 100)) {
        errors.push({ field: 'coachName', message: 'Coach name must be less than 100 characters' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Validation rules for deleting a team
export const deleteTeamValidationRules = () => {
  return [
    (req: Request, res: Response, next: NextFunction): void | Response => {
      const errors: { field: string; message: string }[] = [];
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        errors.push({ field: 'id', message: 'Team ID must be a valid UUID' });
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
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

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// Helper function to validate HEX color
const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};