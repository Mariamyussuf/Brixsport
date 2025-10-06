import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabase.service';
import { cacheService } from '../services/cache.service';
import { websocketService } from '../services/websocket.service';
import { getPerformanceAnalytics } from '../middleware/performance.middleware';

export const userActivityController = {
  // Get current user's activity log
  getMyActivity: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { page = 1, limit = 50, action, startDate, endDate } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch activity log: ${error.message}`);
      }

      res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      });
    } catch (error: any) {
      logger.error('Get my activity error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get current user's statistics
  getMyStatistics: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Try to get from cache first
      const cachedStats = await cacheService.cacheUserEngagement(userId);
      if (cachedStats) {
        res.json({ success: true, data: cachedStats });
        return;
      }

      // Fallback to direct database query
      const { data, error } = await supabase
        .from('user_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user statistics: ${error.message}`);
      }

      const stats = data || {
        user_id: userId,
        total_activities: 0,
        active_days: 0,
        activities_last_7_days: 0,
        activities_last_30_days: 0,
        last_activity: null,
        engagement_level: 'inactive',
        engagement_score: 0
      };

      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Get my statistics error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get user activity (admin only)
  getUserActivity: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50, action, startDate, endDate } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch user activity: ${error.message}`);
      }

      res.json({
        success: true,
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      });
    } catch (error: any) {
      logger.error('Get user activity error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get user statistics (admin only)
  getUserStatistics: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const stats = await cacheService.cacheUserEngagement(userId);
      
      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Get user statistics error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get activity overview (admin only)
  getActivityOverview: async (req: Request, res: Response): Promise<void> => {
    try {
      const { timeRange = '7d' } = req.query;
      
      // Try cache first
      const cacheKey = `activity_overview_${timeRange}`;
      const cached = await cacheService.getCachedStatistics(cacheKey, 'activity_overview');
      
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      // Calculate date range
      const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get activity overview data
      const [activityCount, uniqueUsers, topActions, performanceData] = await Promise.all([
        // Total activity count
        supabase
          .from('user_activity_logs')
          .select('id', { count: 'exact' })
          .gte('created_at', startDate.toISOString()),
        
        // Unique users
        supabase
          .from('user_activity_logs')
          .select('user_id')
          .gte('created_at', startDate.toISOString()),
        
        // Top actions
        supabase
          .from('user_activity_logs')
          .select('action')
          .gte('created_at', startDate.toISOString()),
        
        // Performance data
        getPerformanceAnalytics(timeRange as string)
      ]);

      // Process unique users
      const uniqueUserIds = new Set(uniqueUsers.data?.map(u => u.user_id) || []);
      
      // Process top actions
      const actionCounts = (topActions.data || []).reduce((acc: any, log: any) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});
      
      const topActionsArray = Object.entries(actionCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      const overview = {
        totalActivities: activityCount.count || 0,
        uniqueUsers: uniqueUserIds.size,
        topActions: topActionsArray,
        performance: performanceData,
        timeRange,
        generatedAt: new Date().toISOString()
      };

      // Cache the result
      await cacheService.setCachedStatistics(cacheKey, 'activity_overview', overview, 15);

      res.json({ success: true, data: overview });
    } catch (error: any) {
      logger.error('Get activity overview error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get activity trends (admin only)
  getActivityTrends: async (req: Request, res: Response): Promise<void> => {
    try {
      const { days = 30 } = req.query;
      
      const trends = await cacheService.cacheActivityTrends(Number(days));
      
      // Also get activity heatmap
      const { data: heatmapData, error: heatmapError } = await supabase.rpc('generate_activity_heatmap', { p_days: Number(days) });
      
      const response = {
        trends,
        heatmap: heatmapError ? {} : heatmapData,
        generatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: response });
    } catch (error: any) {
      logger.error('Get activity trends error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get engagement metrics (admin only)
  getEngagementMetrics: async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('user_engagement_metrics')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch engagement metrics: ${error.message}`);
      }

      // Calculate engagement distribution
      const distribution = {
        highly_active: data?.filter(u => u.engagement_level === 'highly_active').length || 0,
        active: data?.filter(u => u.engagement_level === 'active').length || 0,
        moderate: data?.filter(u => u.engagement_level === 'moderate').length || 0,
        inactive: data?.filter(u => u.engagement_level === 'inactive').length || 0
      };

      const avgEngagementScore = data?.length ? 
        data.reduce((sum, u) => sum + u.engagement_score, 0) / data.length : 0;

      const response = {
        users: data || [],
        distribution,
        averageEngagementScore: Math.round(avgEngagementScore),
        totalUsers: data?.length || 0,
        generatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: response });
    } catch (error: any) {
      logger.error('Get engagement metrics error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get retention analytics (admin only)
  getRetentionAnalytics: async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const { data, error } = await supabase.rpc('calculate_user_retention', {
        p_start_date: start.toISOString().split('T')[0],
        p_end_date: end.toISOString().split('T')[0]
      });

      if (error) {
        throw new Error(`Failed to calculate retention: ${error.message}`);
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Get retention analytics error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Generate activity report (admin only)
  generateActivityReport: async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        startDate, 
        endDate, 
        userIds, 
        actions, 
        format = 'json', 
        includeDetails = false 
      } = req.body;

      let query = supabase.from('user_activity_logs').select('*');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      if (actions && actions.length > 0) {
        query = query.in('action', actions);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to generate report: ${error.message}`);
      }

      let reportData = data || [];

      if (!includeDetails) {
        reportData = reportData.map(item => ({
          user_id: item.user_id,
          action: item.action,
          created_at: item.created_at,
          ip_address: item.ip_address
        }));
      }

      if (format === 'csv') {
        const csv = convertToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activity-report.csv');
        res.send(csv);
        return;
      }

      res.json({ 
        success: true, 
        data: reportData,
        summary: {
          totalRecords: reportData.length,
          dateRange: { startDate, endDate },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Generate activity report error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get live activity feed (logger and above)
  getLiveActivityFeed: async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 50 } = req.query;

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          *,
          user:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (error) {
        throw new Error(`Failed to fetch live activity: ${error.message}`);
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Get live activity feed error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get live statistics (logger and above)
  getLiveStatistics: async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await cacheService.cacheRealtimeMetrics();
      
      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Get live statistics error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Chat-related methods
  getChatHistory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const history = await websocketService.getChatHistory(
        matchId, 
        Number(limit), 
        Number(offset)
      );

      res.json(history);
    } catch (error: any) {
      logger.error('Get chat history error', error);
      res.status(500).json({ error: error.message });
    }
  },

  sendChatMessage: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;
      const { message, replyToId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          match_id: matchId,
          user_id: userId,
          message,
          reply_to_id: replyToId || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      // Broadcast the message via WebSocket
      websocketService.emitToRoom(`match:${matchId}`, 'chat:message', {
        id: data.id,
        matchId,
        userId,
        message,
        timestamp: data.created_at
      });

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Send chat message error', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteChatMessage: async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user?.id;

      const result = await websocketService.deleteChatMessage(messageId, userId);
      
      res.json(result);
    } catch (error: any) {
      logger.error('Delete chat message error', error);
      res.status(500).json({ error: error.message });
    }
  },

  getChatModerationReports: async (req: Request, res: Response): Promise<void> => {
    try {
      // This would typically fetch from a moderation reports table
      // For now, return placeholder data
      res.json({ 
        success: true, 
        data: [],
        message: 'Chat moderation reports not yet implemented'
      });
    } catch (error: any) {
      logger.error('Get chat moderation reports error', error);
      res.status(500).json({ error: error.message });
    }
  },

  performChatModerationAction: async (req: Request, res: Response): Promise<void> => {
    try {
      const { action, messageId, userId, reason, duration } = req.body;
      const moderatorId = (req as any).user?.id;

      // Log the moderation action
      await websocketService.handleUserActivityWithAnalytics(
        moderatorId,
        {
          action: 'chat_moderation',
          details: {
            moderationAction: action,
            targetMessageId: messageId,
            targetUserId: userId,
            reason,
            duration
          }
        },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        success: true, 
        message: 'Moderation action logged',
        data: { action, messageId, userId, reason }
      });
    } catch (error: any) {
      logger.error('Perform chat moderation action error', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Match events methods
  getMatchEvents: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;

      const { data, error } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId)
        .eq('deleted', false)
        .order('minute', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch match events: ${error.message}`);
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Get match events error', error);
      res.status(500).json({ error: error.message });
    }
  },

  createMatchEvent: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;
      const { teamId, playerId, eventType, minute, details } = req.body;

      const { data, error } = await supabase
        .from('match_events')
        .insert({
          match_id: matchId,
          team_id: teamId,
          player_id: playerId,
          event_type: eventType,
          minute,
          details: details || {}
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create match event: ${error.message}`);
      }

      // Broadcast the event and update statistics
      await websocketService.handleMatchEventWithStats(matchId, data);

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Create match event error', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateMatchEvent: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId, eventId } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from('match_events')
        .update(updates)
        .eq('id', eventId)
        .eq('match_id', matchId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update match event: ${error.message}`);
      }

      // Broadcast the updated event
      websocketService.emitMatchEvent(matchId, data);

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Update match event error', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteMatchEvent: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId, eventId } = req.params;

      const { data, error } = await supabase
        .from('match_events')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', eventId)
        .eq('match_id', matchId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to delete match event: ${error.message}`);
      }

      // Broadcast the deletion
      websocketService.emitMatchEvent(matchId, { ...data, deleted: true });

      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Delete match event error', error);
      res.status(500).json({ error: error.message });
    }
  },

  bulkCreateMatchEvents: async (req: Request, res: Response): Promise<void> => {
    try {
      const { matchId } = req.params;
      const { events } = req.body;

      const eventsToInsert = events.map((event: any) => ({
        match_id: matchId,
        team_id: event.teamId,
        player_id: event.playerId,
        event_type: event.eventType,
        minute: event.minute,
        details: event.details || {}
      }));

      const { data, error } = await supabase
        .from('match_events')
        .insert(eventsToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to create match events: ${error.message}`);
      }

      // Broadcast all events
      for (const event of data || []) {
        websocketService.emitMatchEvent(matchId, event);
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      logger.error('Bulk create match events error', error);
      res.status(500).json({ error: error.message });
    }
  }
};

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}
