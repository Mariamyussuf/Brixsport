// API Utilities
// Helper functions for working with the API

import { Competition, Match, Team, Player } from './api';

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
  return competitions.filter(comp => comp.type.toLowerCase() === type.toLowerCase());
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
  return competitions.filter(comp => comp.category.toLowerCase() === category.toLowerCase());
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
  return competitions.filter(comp => comp.status.toLowerCase() === status.toLowerCase());
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
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
    const type = comp.type.toLowerCase();
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(comp);
    return groups;
  }, {} as Record<string, Competition[]>);
};

/**
 * Format competition date range for display
 * @param competition Competition object
 * @returns Formatted date range string or 'TBD' if dates not available
 */
export const formatCompetitionDateRange = (competition: Competition): string => {
  if (!competition.start_date) {
    return 'TBD';
  }
  
  const startDate = new Date(competition.start_date);
  const formattedStart = startDate.toLocaleDateString();
  
  if (!competition.end_date) {
    return `Starts ${formattedStart}`;
  }
  
  const endDate = new Date(competition.end_date);
  const formattedEnd = endDate.toLocaleDateString();
  
  return `${formattedStart} - ${formattedEnd}`;
};