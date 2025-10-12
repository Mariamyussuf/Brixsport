// API Utilities
// Helper functions for working with the API

import { Competition, Team, Player } from '@/lib/api';
import { ApiError, MatchEvent } from '@/types/matchTracker';

export const isValidationError = (error: any): error is ApiError & { errors: Record<string, string[]> } => {
  return error && 'errors' in error && typeof error.errors === 'object';
};

export const handleApiError = (error: any): void => {
  // Create a standardized error object consistent with ApiError type
  const apiError: ApiError = {
    message: error?.message || 'An unexpected error occurred',
    code: error?.code || 'UNKNOWN_ERROR'
  };

  // If it's already an API error with validation errors, include them
  if (isValidationError(error)) {
    (apiError as any).errors = error.errors;
  }

  // Log error to console
  console.error('API Error:', apiError);

  // Re-throw the standardized error
  throw apiError;
};

// Type guard to check if an error is an ApiError
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'message' in error;
};

/**
 * Filter competitions by type (sport)
 * @param competitions Array of competitions
 * @param type Sport type to filter by (e.g., 'football', 'basketball')
 * @returns Filtered competitions
 */
export const filterCompetitionsByType = (
  competitions: Competition[],
  type: string
): Competition[] => {
  return competitions.filter(comp => comp.type && comp.type.toLowerCase() === type.toLowerCase());
};

/**
 * Filter competitions by category
 * @param competitions Array of competitions
 * @param category Category to filter by (e.g., 'school', 'inter-team')
 * @returns Filtered competitions
 */
export const filterCompetitionsByCategory = (
  competitions: Competition[],
  category: string
): Competition[] => {
  return competitions.filter(comp => comp.category && comp.category.toLowerCase() === category.toLowerCase());
};

/**
 * Filter competitions by status
 * @param competitions Array of competitions
 * @param status Status to filter by (e.g., 'active', 'completed')
 * @returns Filtered competitions
 */
export const filterCompetitionsByStatus = (
  competitions: Competition[],
  status: string
): Competition[] => {
  return competitions.filter(comp => comp.status && comp.status.toLowerCase() === status.toLowerCase());
};

/**
 * Sort competitions by creation date (newest first)
 * @param competitions Array of competitions
 * @returns Sorted competitions
 */
export const sortCompetitionsByNewest = (
  competitions: Competition[]
): Competition[] => {
  return [...competitions].sort((a, b) => {
    // Handle case where created_at might be undefined
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
};

/**
 * Group competitions by type (sport)
 * @param competitions Array of competitions
 * @returns Object with competitions grouped by type
 */
export const groupCompetitionsByType = (
  competitions: Competition[]
): Record<string, Competition[]> => {
  return competitions.reduce((groups, comp) => {
    // Handle case where type might be undefined
    const type = comp.type ? comp.type.toLowerCase() : 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(comp);
    return groups;
  }, {} as Record<string, Competition[]>);
};

/**
 * Format competition date range in different formats
 * @param competition Competition object
 * @param formatType Format type: 'short', 'long', or 'relative'
 * @returns Formatted date range string
 */
export const formatCompetitionDateRange = (
  competition: Competition,
  formatType: 'short' | 'long' | 'relative' = 'short'
): string => {
  if (!competition.start_date) {
    return 'TBD';
  }
  
  const startDate = new Date(competition.start_date);
  let formattedStart = '';
  
  switch(formatType) {
    case 'short':
      formattedStart = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      break;
    case 'long':
      formattedStart = startDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      break;
    case 'relative':
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Today';
      } else if (diffDays < 2) {
        return 'Tomorrow';
      } else if (diffDays <= 7) {
        return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else {
        return startDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    default:
      formattedStart = startDate.toLocaleDateString();
  }
  
  if (!competition.end_date) {
    return `Starts ${formattedStart}`;
  }
  
  const endDate = new Date(competition.end_date);
  let formattedEnd = '';
  
  switch(formatType) {
    case 'short':
      formattedEnd = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      break;
    case 'long':
      formattedEnd = endDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      break;
    default:
      formattedEnd = endDate.toLocaleDateString();
  }
  
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Filter competitions by search term
 * @param competitions Array of competitions
 * @param searchTerm Search term to filter by
 * @returns Filtered competitions
 */
export const filterCompetitionsBySearch = (
  competitions: Competition[],
  searchTerm: string
): Competition[] => {
  if (!searchTerm) return competitions;
  
  const term = searchTerm.toLowerCase();
  return competitions.filter(comp => 
    (comp.name && comp.name.toLowerCase().includes(term)) ||
    (comp.type && comp.type.toLowerCase().includes(term)) ||
    (comp.category && comp.category.toLowerCase().includes(term))
  );
};

/**
 * Sort competitions by name (A-Z or Z-A)
 * @param competitions Array of competitions
 * @param order Sort order: 'asc' for ascending, 'desc' for descending
 * @returns Sorted competitions
 */
export const sortCompetitionsByName = (
  competitions: Competition[],
  order: 'asc' | 'desc' = 'asc'
): Competition[] => {
  return [...competitions].sort((a, b) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    
    if (order === 'asc') {
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    } else {
      return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
    }
  });
};

/**
 * Get active competitions (not completed)
 * @param competitions Array of competitions
 * @returns Active competitions
 */
export const getActiveCompetitions = (
  competitions: Competition[]
): Competition[] => {
  const now = new Date();
  return competitions.filter(comp => {
    if (comp.status && comp.status.toLowerCase() === 'completed') return false;
    
    // If no end date, consider it active
    if (!comp.end_date) return true;
    
    // If end date is in the future, it's active
    return new Date(comp.end_date) > now;
  });
};

/**
 * Get completed competitions
 * @param competitions Array of competitions
 * @returns Completed competitions
 */
export const getCompletedCompetitions = (
  competitions: Competition[]
): Competition[] => {
  const now = new Date();
  return competitions.filter(comp => {
    if (comp.status && comp.status.toLowerCase() === 'completed') return true;
    
    // If has end date and it's in the past
    return !!(comp.end_date && new Date(comp.end_date) < now);
  });
};
