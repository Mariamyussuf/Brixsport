import { analyticsService } from '../services/analytics.service';
import { supabaseService } from '../services/supabase.service';
import { cacheService } from '../services/cache.service';

// Mock the supabase service
jest.mock('../services/supabase.service', () => ({
  supabaseService: {
    getPlayer: jest.fn(),
    getTeam: jest.fn(),
    getTeamMatches: jest.fn(),
    getMatchEventsByPlayer: jest.fn(),
    listReports: jest.fn(),
    getReport: jest.fn(),
    createReport: jest.fn(),
    deleteReport: jest.fn(),
    listDashboards: jest.fn(),
    getDashboard: jest.fn(),
    createDashboard: jest.fn(),
    updateDashboard: jest.fn(),
    deleteDashboard: jest.fn(),
    getSystemMetrics: jest.fn()
  }
}));

// Mock the cache service
jest.mock('../services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getPlayerPerformance', () => {
    it('should fetch player performance from database when not cached', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.getPlayer as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'player1', name: 'John Doe', teamId: 'team1' }
      });
      
      (supabaseService.getTeamMatches as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          { id: 'match1', status: 'finished', home_team_id: 'team1', home_score: 2, away_score: 1 },
          { id: 'match2', status: 'finished', away_team_id: 'team1', home_score: 1, away_score: 3 }
        ]
      });
      
      (supabaseService.getMatchEventsByPlayer as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          { eventType: 'goal' },
          { eventType: 'goal' },
          { eventType: 'assist' }
        ]
      });
      
      const result = await analyticsService.getPlayerPerformance('player1');
      
      expect(result.success).toBe(true);
      expect(result.data.playerName).toBe('John Doe');
      expect(result.data.performanceMetrics.goals).toBe(2);
      expect(result.data.performanceMetrics.assists).toBe(1);
      expect(result.data.performanceMetrics.matchesPlayed).toBe(2);
      
      // Verify cache was set
      expect(cacheService.set).toHaveBeenCalledWith(
        'playerPerformance:player1',
        expect.any(Object),
        600
      );
    });
    
    it('should return cached data when available', async () => {
      // Mock cache hit
      (cacheService.get as jest.Mock).mockResolvedValue({
        playerId: 'player1',
        playerName: 'John Doe',
        performanceMetrics: {
          goals: 5,
          assists: 3,
          matchesPlayed: 10
        }
      });
      
      const result = await analyticsService.getPlayerPerformance('player1');
      
      expect(result.success).toBe(true);
      expect(result.data.playerName).toBe('John Doe');
      expect(cacheService.get).toHaveBeenCalledWith('playerPerformance:player1');
      // Verify database calls were not made
      expect(supabaseService.getPlayer).not.toHaveBeenCalled();
    });
  });

  describe('getTeamPerformance', () => {
    it('should fetch team performance from database when not cached', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.getTeam as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'team1', name: 'Team Alpha' }
      });
      
      (supabaseService.getTeamMatches as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          { id: 'match1', status: 'finished', home_team_id: 'team1', home_score: 2, away_score: 1 },
          { id: 'match2', status: 'finished', away_team_id: 'team1', home_score: 1, away_score: 3 }
        ]
      });
      
      const result = await analyticsService.getTeamPerformance('team1');
      
      expect(result.success).toBe(true);
      expect(result.data.teamName).toBe('Team Alpha');
      expect(result.data.performanceMetrics.wins).toBe(1);
      expect(result.data.performanceMetrics.losses).toBe(1);
      expect(result.data.performanceMetrics.draws).toBe(0);
      expect(result.data.performanceMetrics.points).toBe(3); // 1 win = 3 points
      
      // Verify cache was set
      expect(cacheService.set).toHaveBeenCalledWith(
        'teamPerformance:team1',
        expect.any(Object),
        600
      );
    });
  });

  describe('getUserOverview', () => {
    it('should fetch user overview from database when not cached', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.getSystemMetrics as jest.Mock).mockResolvedValue({
        success: true,
        data: { totalUsers: 10000, activeUsers: 7000 }
      });
      
      const result = await analyticsService.getUserOverview();
      
      expect(result.success).toBe(true);
      expect(result.data.totalUsers).toBe(10000);
      expect(result.data.activeUsers).toBe(7000);
      
      // Verify cache was set
      expect(cacheService.set).toHaveBeenCalledWith(
        'userOverview',
        expect.any(Object),
        300
      );
    });
  });

  describe('Reports', () => {
    it('should create and save a report to the database', async () => {
      // Mock cache
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.createReport as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'report1', name: 'Test Report' }
      });
      
      const result = await analyticsService.generateReport('user', {}, 'pdf');
      
      expect(result.success).toBe(true);
      expect(supabaseService.createReport).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        'reports',
        expect.any(Array),
        60
      );
    });
    
    it('should fetch reports from database when not cached', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.listReports as jest.Mock).mockResolvedValue({
        success: true,
        data: [{ id: 'report1', name: 'Test Report' }]
      });
      
      const result = await analyticsService.listReports();
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(supabaseService.listReports).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        'reports',
        expect.any(Array),
        60
      );
    });
  });

  describe('Dashboards', () => {
    it('should create and save a dashboard to the database', async () => {
      // Mock cache
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.createDashboard as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'dashboard1', name: 'Test Dashboard' }
      });
      
      const result = await analyticsService.createDashboard('Test Dashboard', 'Test Description', []);
      
      expect(result.success).toBe(true);
      expect(supabaseService.createDashboard).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        'dashboards',
        expect.any(Array),
        60
      );
    });
    
    it('should fetch dashboards from database when not cached', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      
      // Mock database responses
      (supabaseService.listDashboards as jest.Mock).mockResolvedValue({
        success: true,
        data: [{ id: 'dashboard1', name: 'Test Dashboard' }]
      });
      
      const result = await analyticsService.listDashboards();
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(supabaseService.listDashboards).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        'dashboards',
        expect.any(Array),
        60
      );
    });
  });
});