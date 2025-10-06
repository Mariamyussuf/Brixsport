import { SearchController } from './search.controller';
import searchService from '../services/search.service';

// Mock the search service
jest.mock('../services/search.service');

describe('SearchController', () => {
  let searchController: SearchController;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    searchController = new SearchController();
    mockRequest = {
      query: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch', () => {
    it('should return 400 if search query is missing', async () => {
      mockRequest.query = {};

      await searchController.globalSearch(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query (q) is required'
        }
      });
    });

    it('should call searchService.globalSearch with correct parameters', async () => {
      mockRequest.query = {
        q: 'football',
        entities: 'team,player',
        sort: 'relevance',
        page: '1',
        limit: '10'
      };

      const mockResults = {
        results: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };

      (searchService.globalSearch as jest.Mock).mockResolvedValue(mockResults);

      await searchController.globalSearch(mockRequest, mockResponse);

      expect(searchService.globalSearch).toHaveBeenCalledWith({
        q: 'football',
        entities: ['team', 'player'],
        sort: 'relevance',
        page: 1,
        limit: 10,
        fuzzy: undefined,
        filters: {
          sport: undefined,
          status: undefined,
          location: undefined,
          dateRange: undefined
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResults);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return 400 if search query is missing', async () => {
      mockRequest.query = {};

      await searchController.getSearchSuggestions(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query (q) is required'
        }
      });
    });

    it('should call searchService.getSearchSuggestions with correct parameters', async () => {
      mockRequest.query = {
        q: 'foot',
        limit: '5'
      };

      const mockSuggestions = [
        { term: 'football', frequency: 100 },
        { term: 'football team', frequency: 50 }
      ];

      (searchService.getSearchSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);

      await searchController.getSearchSuggestions(mockRequest, mockResponse);

      expect(searchService.getSearchSuggestions).toHaveBeenCalledWith('foot', 5);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        suggestions: mockSuggestions
      });
    });
  });

  describe('getTrendingSearches', () => {
    it('should call searchService.getTrendingSearches with correct parameters', async () => {
      mockRequest.query = {
        limit: '10'
      };

      const mockTrending = [
        { term: 'football', frequency: 100 },
        { term: 'basketball', frequency: 80 }
      ];

      (searchService.getTrendingSearches as jest.Mock).mockResolvedValue(mockTrending);

      await searchController.getTrendingSearches(mockRequest, mockResponse);

      expect(searchService.getTrendingSearches).toHaveBeenCalledWith(10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        trending: mockTrending
      });
    });
  });

  describe('rebuildIndex', () => {
    it('should call searchService.rebuildIndex', async () => {
      (searchService.rebuildIndex as jest.Mock).mockResolvedValue(undefined);

      await searchController.rebuildIndex(mockRequest, mockResponse);

      expect(searchService.rebuildIndex).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Search index rebuilt successfully'
      });
    });
  });

  describe('rebuildEntityIndex', () => {
    it('should call searchService.rebuildEntityIndex with correct parameters', async () => {
      mockRequest.params = {
        entity: 'team'
      };

      (searchService.rebuildEntityIndex as jest.Mock).mockResolvedValue(undefined);

      await searchController.rebuildEntityIndex(mockRequest, mockResponse);

      expect(searchService.rebuildEntityIndex).toHaveBeenCalledWith('team');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Search index for team rebuilt successfully'
      });
    });
  });

  describe('getAnalytics', () => {
    it('should call searchService.getAnalytics', async () => {
      const mockAnalytics = {
        totalSearches: 1000,
        popularTerms: [],
        zeroResultQueries: [],
        averageResponseTime: 150
      };

      (searchService.getAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      await searchController.getAnalytics(mockRequest, mockResponse);

      expect(searchService.getAnalytics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAnalytics);
    });
  });

  describe('clearCache', () => {
    it('should call searchService.clearCache', async () => {
      (searchService.clearCache as jest.Mock).mockResolvedValue(undefined);

      await searchController.clearCache(mockRequest, mockResponse);

      expect(searchService.clearCache).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Search cache cleared successfully'
      });
    });
  });
});