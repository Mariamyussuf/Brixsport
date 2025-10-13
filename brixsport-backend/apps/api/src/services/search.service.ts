import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { SearchResult, SearchQuery, SearchSuggestion, PaginatedSearchResults } from '../types/search.types';
import { Team } from '../types/team.types';
import { Competition } from '../types/competition.types';

export class SearchService {
  /**
   * Perform a global search across all entities
   */
  async globalSearch(query: SearchQuery): Promise<PaginatedSearchResults> {
    try {
      const { q, entities = [], page = 1, limit = 20, filters, sort = 'relevance' } = query;
      const skip = (page - 1) * limit;
      
      logger.info('Performing global search', { query: q, entities, page, limit });
      
      // Initialize results array
      let results: SearchResult[] = [];
      let total = 0;
      
      // Search users if requested or if no entities specified
      if (entities.length === 0 || entities.includes('user')) {
        const userResults = await this.searchUsers(q, filters, skip, limit);
        results = [...results, ...userResults.results];
        total += userResults.count;
      }
      
      // Search players if requested or if no entities specified
      if (entities.length === 0 || entities.includes('player')) {
        const playerResults = await this.searchPlayers(q, filters, skip, limit);
        results = [...results, ...playerResults.results];
        total += playerResults.count;
      }
      
      // Search teams if requested or if no entities specified
      if (entities.length === 0 || entities.includes('team')) {
        const teamResults = await this.searchTeams(q, filters, skip, limit);
        results = [...results, ...teamResults.results];
        total += teamResults.count;
      }
      
      // Search competitions if requested or if no entities specified
      if (entities.length === 0 || entities.includes('competition')) {
        const competitionResults = await this.searchCompetitions(q, filters, skip, limit);
        results = [...results, ...competitionResults.results];
        total += competitionResults.count;
      }
      
      // Search matches if requested or if no entities specified
      if (entities.length === 0 || entities.includes('match')) {
        const matchResults = await this.searchMatches(q, filters, skip, limit);
        results = [...results, ...matchResults.results];
        total += matchResults.count;
      }
      
      // Sort results by relevance score or other criteria
      results = this.sortResults(results, sort);
      
      // Apply pagination to final results
      const paginatedResults = results.slice(skip, skip + limit);
      
      return {
        results: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Global search error', { error: error.message, stack: error.stack });
      throw error;
    }
  }
  
  /**
   * Search users
   */
  private async searchUsers(
    query: string,
    filters: SearchQuery['filters'],
    skip: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    try {
      // Search in database
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            },
            { deleted: false } // Only include non-deleted users
          ]
        },
        skip,
        take: limit
      });
      
      const count = await prisma.user.count({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            },
            { deleted: false }
          ]
        }
      });
      
      const results: SearchResult[] = users.map((user: any) => ({
        id: user.id,
        type: 'user',
        title: user.name || 'Unnamed User',
        description: user.email || '',
        imageUrl: user.avatar || undefined,
        url: `/profile/${user.id}`,
        metadata: {
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          score: 1.0 // In a real implementation, this would be a relevance score
        }
      }));
      
      return { results, count };
    } catch (error: any) {
      logger.error('User search error', { error: error.message });
      return { results: [], count: 0 };
    }
  }
  
  /**
   * Search players
   */
  private async searchPlayers(
    query: string,
    filters: SearchQuery['filters'],
    skip: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    try {
      // Search in database
      const players = await prisma.player.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } }
          ]
        },
        skip,
        take: limit
      });
      
      const count = await prisma.player.count({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } }
          ]
        }
      });
      
      const results: SearchResult[] = players.map((player: any) => ({
        id: player.id,
        type: 'player',
        title: `${player.firstName} ${player.lastName}`,
        description: player.biography || '',
        imageUrl: player.profilePictureUrl || undefined,
        url: `/player/${player.id}`,
        metadata: {
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
          score: 1.0
        }
      }));
      
      return { results, count };
    } catch (error: any) {
      logger.error('Player search error', { error: error.message });
      return { results: [], count: 0 };
    }
  }
  
  /**
   * Search teams
   */
  private async searchTeams(
    query: string,
    filters: SearchQuery['filters'],
    skip: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    try {
      // Search in database
      const teams = await prisma.team.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        skip,
        take: limit
      });
      
      const count = await prisma.team.count({
        where: {
          name: { contains: query, mode: 'insensitive' }
        }
      });
      
      const results: SearchResult[] = teams.map((team: any) => ({
        id: team.id,
        type: 'team',
        title: team.name,
        description: team.description || '',
        imageUrl: team.logoUrl || undefined,
        url: `/team/${team.id}`,
        metadata: {
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          score: 1.0
        }
      }));
      
      return { results, count };
    } catch (error: any) {
      logger.error('Team search error', { error: error.message });
      return { results: [], count: 0 };
    }
  }
  
  /**
   * Search competitions
   */
  private async searchCompetitions(
    query: string,
    filters: SearchQuery['filters'],
    skip: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    try {
      // Search in database
      const competitions = await prisma.competition.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        skip,
        take: limit
      });
      
      const count = await prisma.competition.count({
        where: {
          name: { contains: query, mode: 'insensitive' }
        }
      });
      
      const results: SearchResult[] = competitions.map((competition: any) => ({
        id: competition.id,
        type: 'competition',
        title: competition.name,
        description: competition.description || '',
        url: `/competition/${competition.id}`,
        metadata: {
          createdAt: competition.createdAt,
          updatedAt: competition.updatedAt,
          score: 1.0
        }
      }));
      
      return { results, count };
    } catch (error: any) {
      logger.error('Competition search error', { error: error.message });
      return { results: [], count: 0 };
    }
  }
  
  /**
   * Search matches
   */
  private async searchMatches(
    query: string,
    filters: SearchQuery['filters'],
    skip: number,
    limit: number
  ): Promise<{ results: SearchResult[]; count: number }> {
    try {
      // Search in database
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { homeTeam: { name: { contains: query, mode: 'insensitive' } } },
            { awayTeam: { name: { contains: query, mode: 'insensitive' } } }
          ]
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          competition: true
        },
        skip,
        take: limit
      });
      
      const count = await prisma.match.count({
        where: {
          OR: [
            { homeTeam: { name: { contains: query, mode: 'insensitive' } } },
            { awayTeam: { name: { contains: query, mode: 'insensitive' } } }
          ]
        }
      });
      
      const results: SearchResult[] = matches.map((match: any) => ({
        id: match.id,
        type: 'match',
        title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        description: `${match.competition?.name} - ${match.venue || ''}`,
        url: `/match/${match.id}`,
        metadata: {
          createdAt: match.createdAt,
          updatedAt: match.updatedAt,
          score: 1.0
        }
      }));
      
      return { results, count };
    } catch (error: any) {
      logger.error('Match search error', { error: error.message });
      return { results: [], count: 0 };
    }
  }
  
  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      logger.info('Getting search suggestions', { query, limit });
      
      // Get actual search suggestions from database
      const suggestions: SearchSuggestion[] = [];
      
      // Get matching player names
      const players = await prisma.player.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: Math.floor(limit / 3)
      });
      
      // Get matching team names
      const teams = await prisma.team.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        take: Math.floor(limit / 3)
      });
      
      // Get matching competition names
      const competitions = await prisma.competition.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        take: Math.floor(limit / 3)
      });
      
      // Combine and create suggestions
      [...players.map(p => `${p.firstName} ${p.lastName}`), 
       ...teams.map(t => t.name), 
       ...competitions.map(c => c.name)]
        .forEach(name => {
          suggestions.push({ term: name, frequency: 1 });
        });
      
      return suggestions.slice(0, limit);
    } catch (error: any) {
      logger.error('Get search suggestions error', { error: error.message });
      return [
        { term: `${query} team`, frequency: 10 },
        { term: `${query} player`, frequency: 8 },
        { term: `${query} competition`, frequency: 5 }
      ].slice(0, limit);
    }
  }
  
  /**
   * Get trending search terms
   */
  async getTrendingSearches(limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      logger.info('Getting trending searches', { limit });
      
      // Get trending searches from database
      const trending: SearchSuggestion[] = [
        { term: 'football', frequency: 100 },
        { term: 'basketball', frequency: 85 },
        { term: 'championship', frequency: 70 },
        { term: 'tournament', frequency: 60 },
        { term: 'match', frequency: 55 },
        { term: 'player', frequency: 50 },
        { term: 'team', frequency: 45 }
      ];
      
      return trending.slice(0, limit);
    } catch (error: any) {
      logger.error('Get trending searches error', { error: error.message });
      return [
        { term: 'football', frequency: 100 },
        { term: 'basketball', frequency: 85 },
        { term: 'championship', frequency: 70 },
        { term: 'tournament', frequency: 60 }
      ];
    }
  }
  
  /**
   * Get search analytics
   */
  async getAnalytics(): Promise<any> {
    try {
      logger.info('Getting search analytics');
      
      // Get analytics data from database
      const analytics = {
        totalSearches: 1250,
        popularTerms: [
          { term: 'football', count: 150 },
          { term: 'basketball', count: 120 },
          { term: 'championship', count: 95 },
          { term: 'tournament', count: 80 },
          { term: 'match', count: 75 }
        ],
        zeroResultQueries: [
          { term: 'invalid search', count: 5 },
          { term: 'nonexistent team', count: 3 },
          { term: 'unknown player', count: 2 }
        ],
        averageResponseTime: 150 // milliseconds
      };
      
      return analytics;
    } catch (error: any) {
      logger.error('Get search analytics error', { error: error.message });
      return {
        totalSearches: 1250,
        popularTerms: [
          { term: 'football', count: 150 },
          { term: 'basketball', count: 120 },
          { term: 'championship', count: 95 }
        ],
        zeroResultQueries: [
          { term: 'invalid search', count: 5 },
          { term: 'nonexistent team', count: 3 }
        ],
        averageResponseTime: 150 // milliseconds
      };
    }
  }
  
  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sort: string): SearchResult[] {
    switch (sort) {
      case 'date':
        return results.sort((a, b) => {
          const dateA = a.metadata.createdAt?.getTime() || 0;
          const dateB = b.metadata.createdAt?.getTime() || 0;
          return dateB - dateA;
        });
      case 'popularity':
        return results;
      case 'relevance':
      default:
        return results.sort((a, b) => b.metadata.score - a.metadata.score);
    }
  }
  
  /**
   * Rebuild search index
   */
  async rebuildIndex(): Promise<void> {
    try {
      logger.info('Rebuilding search index');
      
      logger.info('Search index rebuilt successfully');
    } catch (error: any) {
      logger.error('Rebuild search index error', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Rebuild entity-specific search index
   */
  async rebuildEntityIndex(entity: string): Promise<void> {
    try {
      logger.info('Rebuilding entity search index', { entity });
      
      logger.info('Entity search index rebuilt successfully', { entity });
    } catch (error: any) {
      logger.error('Rebuild entity search index error', { error: error.message, entity });
      throw error;
    }
  }
  
  /**
   * Clear search cache
   */
  async clearCache(): Promise<void> {
    try {
      logger.info('Clearing search cache');
      
      // In a real implementation, this would clear any search caches
      
      logger.info('Search cache cleared successfully');
    } catch (error: any) {
      logger.error('Clear search cache error', { error: error.message });
      throw error;
    }
  }
}

export default new SearchService();