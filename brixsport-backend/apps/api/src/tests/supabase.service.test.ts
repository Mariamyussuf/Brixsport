import { supabaseService } from '../services/supabase.service';
import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client
const mockFrom = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockOr = jest.fn().mockReturnThis();
const mockIlike = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockRange = jest.fn().mockReturnThis();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    or: mockOr,
    ilike: mockIlike,
    order: mockOrder,
    range: mockRange
  })
}));

describe('Supabase Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockFrom.mockClear();
    mockSelect.mockClear();
    mockEq.mockClear();
    mockSingle.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockOr.mockClear();
    mockIlike.mockClear();
    mockOrder.mockClear();
    mockRange.mockClear();
  });

  describe('Player Methods', () => {
    it('should fetch a player by ID', async () => {
      const mockPlayer = { id: 'player1', name: 'John Doe', teamId: 'team1' };
      
      // Mock the Supabase client response
      mockSingle.mockResolvedValueOnce({
        data: mockPlayer,
        error: null
      });
      
      const result = await supabaseService.getPlayer('player1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPlayer);
      expect(mockFrom).toHaveBeenCalledWith('Player');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'player1');
      expect(mockSingle).toHaveBeenCalled();
    });
    
    it('should handle player not found error', async () => {
      // Mock the Supabase client response
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Player not found' }
      });
      
      await expect(supabaseService.getPlayer('player1')).rejects.toThrow('Player not found');
    });
  });

  describe('Team Methods', () => {
    it('should fetch a team by ID', async () => {
      const mockTeam = { id: 'team1', name: 'Team Alpha' };
      
      // Mock the Supabase client response
      mockSingle.mockResolvedValueOnce({
        data: mockTeam,
        error: null
      });
      
      const result = await supabaseService.getTeam('team1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTeam);
      expect(mockFrom).toHaveBeenCalledWith('Team');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'team1');
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe('Match Methods', () => {
    it('should fetch matches for a team', async () => {
      const mockMatches = [
        { id: 'match1', homeTeamId: 'team1', awayTeamId: 'team2' },
        { id: 'match2', homeTeamId: 'team3', awayTeamId: 'team1' }
      ];
      
      // Mock the Supabase client response
      mockOr.mockResolvedValueOnce({
        data: mockMatches,
        error: null
      });
      
      const result = await supabaseService.getTeamMatches('team1');
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(mockFrom).toHaveBeenCalledWith('Match');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockOr).toHaveBeenCalled();
    });
  });

  describe('Match Event Methods', () => {
    it('should fetch events for a player', async () => {
      const mockEvents = [
        { id: 'event1', playerId: 'player1', eventType: 'goal' },
        { id: 'event2', playerId: 'player1', eventType: 'assist' }
      ];
      
      // Mock the Supabase client response
      mockEq.mockResolvedValueOnce({
        data: mockEvents,
        error: null
      });
      
      const result = await supabaseService.getMatchEventsByPlayer('player1');
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(mockFrom).toHaveBeenCalledWith('MatchEvent');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('playerId', 'player1');
    });
  });

  describe('Report Methods', () => {
    it('should create a report', async () => {
      const mockReport = { id: 'report1', name: 'Test Report' };
      
      // Mock the Supabase client response
      mockSingle.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });
      
      const result = await supabaseService.createReport(mockReport);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReport);
      expect(mockFrom).toHaveBeenCalledWith('Report');
      expect(mockInsert).toHaveBeenCalledWith(mockReport);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });
    
    it('should list reports', async () => {
      const mockReports = [
        { id: 'report1', name: 'Test Report 1' },
        { id: 'report2', name: 'Test Report 2' }
      ];
      
      // Mock the Supabase client response
      mockSelect.mockResolvedValueOnce({
        data: mockReports,
        error: null
      });
      
      const result = await supabaseService.listReports();
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(mockFrom).toHaveBeenCalledWith('Report');
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('Dashboard Methods', () => {
    it('should create a dashboard', async () => {
      const mockDashboard = { id: 'dashboard1', name: 'Test Dashboard' };
      
      // Mock the Supabase client response
      mockSingle.mockResolvedValueOnce({
        data: mockDashboard,
        error: null
      });
      
      const result = await supabaseService.createDashboard(mockDashboard);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDashboard);
      expect(mockFrom).toHaveBeenCalledWith('Dashboard');
      expect(mockInsert).toHaveBeenCalledWith(mockDashboard);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });
    
    it('should list dashboards', async () => {
      const mockDashboards = [
        { id: 'dashboard1', name: 'Test Dashboard 1' },
        { id: 'dashboard2', name: 'Test Dashboard 2' }
      ];
      
      // Mock the Supabase client response
      mockSelect.mockResolvedValueOnce({
        data: mockDashboards,
        error: null
      });
      
      const result = await supabaseService.listDashboards();
      
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(mockFrom).toHaveBeenCalledWith('Dashboard');
      expect(mockSelect).toHaveBeenCalled();
    });
  });
});