import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';
import { supabase } from './supabase.service';
import { getIO } from '../sockets';
import { cacheService } from './cache.service';

// Store active WebSocket connections
const activeConnections: Map<string, any> = new Map();
const userConnections: Map<string, string[]> = new Map();

export const websocketService = {
  initialize: (socketIO: any) => {
    logger.info('WebSocket service initialized');
    
    // Handle connections
    socketIO.on('connection', (socket: any) => {
      logger.info('User connected', { socketId: socket.id });
      
      // Store connection
      activeConnections.set(socket.id, {
        socket,
        connectedAt: new Date(),
        lastPing: new Date()
      });
      
      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
        // Update last ping time
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.lastPing = new Date();
          activeConnections.set(socket.id, connection);
        }
      });
      
      // Handle user authentication
      socket.on('user:authenticate', (userId: string) => {
        logger.info('User authenticated', { socketId: socket.id, userId });
        // Associate socket with user
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.userId = userId;
          activeConnections.set(socket.id, connection);
          
          // Track user connections
          if (!userConnections.has(userId)) {
            userConnections.set(userId, []);
          }
          userConnections.get(userId)?.push(socket.id);
        }
      });
      
      // Handle match join
      socket.on('match:join', (matchId: string) => {
        logger.info('User joined match room', { socketId: socket.id, matchId });
        socket.join(`match:${matchId}`);
      });
      
      // Handle match leave
      socket.on('match:leave', (matchId: string) => {
        logger.info('User left match room', { socketId: socket.id, matchId });
        socket.leave(`match:${matchId}`);
      });
      
      // Handle sport-specific match join
      socket.on('sport:match:join', (data: any) => {
        const { matchId, sport } = data;
        logger.info('User joined sport match room', { socketId: socket.id, matchId, sport });
        socket.join(`sport:${sport}:${matchId}`);
      });
      
      // Handle sport-specific match leave
      socket.on('sport:match:leave', (data: any) => {
        const { matchId, sport } = data;
        logger.info('User left sport match room', { socketId: socket.id, matchId, sport });
        socket.leave(`sport:${sport}:${matchId}`);
      });
      
      // Handle live matches join
      socket.on('live:matches:join', (data: any) => {
        const { sport } = data || {};
        if (sport) {
          logger.info('User joined live matches room for sport', { socketId: socket.id, sport });
          socket.join(`live:${sport}`);
        } else {
          logger.info('User joined all live matches room', { socketId: socket.id });
          socket.join('live:all');
        }
      });
      
      // Handle live matches leave
      socket.on('live:matches:leave', (data: any) => {
        const { sport } = data || {};
        if (sport) {
          logger.info('User left live matches room for sport', { socketId: socket.id, sport });
          socket.leave(`live:${sport}`);
        } else {
          logger.info('User left all live matches room', { socketId: socket.id });
          socket.leave('live:all');
        }
      });
      
      // Handle user-specific notifications join
      socket.on('user:notifications:join', (userId: string) => {
        logger.info('User joined notifications room', { socketId: socket.id, userId });
        socket.join(`user:${userId}`);
      });
      
      // Handle user-specific notifications leave
      socket.on('user:notifications:leave', (userId: string) => {
        logger.info('User left notifications room', { socketId: socket.id, userId });
        socket.leave(`user:${userId}`);
      });
      
      // Handle admin events
      socket.on('admin:join', () => {
        logger.info('Admin joined admin room', { socketId: socket.id });
        socket.join('admin');
      });
      
      // Handle admin events leave
      socket.on('admin:leave', () => {
        logger.info('Admin left admin room', { socketId: socket.id });
        socket.leave('admin');
      });
      
      // Handle analytics dashboard join
      socket.on('analytics:joinDashboard', (dashboardId: string) => {
        logger.info('User joined analytics dashboard room', { socketId: socket.id, dashboardId });
        socket.join(`analytics:dashboard:${dashboardId}`);
      });
      
      // Handle analytics dashboard leave
      socket.on('analytics:leaveDashboard', (dashboardId: string) => {
        logger.info('User left analytics dashboard room', { socketId: socket.id, dashboardId });
        socket.leave(`analytics:dashboard:${dashboardId}`);
      });
      
      // Handle subscription to live metrics updates
      socket.on('analytics:subscribeLiveMetrics', () => {
        logger.info('User subscribed to live metrics updates', { socketId: socket.id });
        socket.join('analytics:liveMetrics');
      });
      
      // Handle unsubscription from live metrics updates
      socket.on('analytics:unsubscribeLiveMetrics', () => {
        logger.info('User unsubscribed from live metrics updates', { socketId: socket.id });
        socket.leave('analytics:liveMetrics');
      });
      
      // Handle chat messages
      socket.on('chat:message', async (data: any) => {
        const { matchId, userId, message, timestamp } = data;
        logger.info('Chat message received', { matchId, userId, message });
        
        try {
          // Store message in database
          const chatMessage = {
            match_id: matchId,
            user_id: userId,
            message: message,
            created_at: timestamp || new Date().toISOString()
          };

          const { data: savedMessage, error } = await supabase
            .from('chat_messages')
            .insert([chatMessage])
            .select()
            .single();

          if (error) {
            logger.error('Failed to save chat message to database', { error: error.message, matchId, userId });
          }

          // Broadcast to all users in match room
          socketIO.to(`match:${matchId}`).emit('chat:message', {
            id: savedMessage?.id,
            matchId,
            userId,
            message,
            timestamp: timestamp || new Date()
          });
        } catch (error: any) {
          logger.error('Error handling chat message', { error, matchId, userId });
          
          // Still broadcast even if database save fails
          socketIO.to(`match:${matchId}`).emit('chat:message', {
            matchId,
            userId,
            message,
            timestamp: timestamp || new Date()
          });
        }
      });
      
      // Handle chat join
      socket.on('chat:join', (matchId: string) => {
        logger.info('User joined chat room', { socketId: socket.id, matchId });
        socket.join(`chat:${matchId}`);
      });
      
      // Handle chat leave
      socket.on('chat:leave', (matchId: string) => {
        logger.info('User left chat room', { socketId: socket.id, matchId });
        socket.leave(`chat:${matchId}`);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info('User disconnected', { socketId: socket.id });
        
        // Clean up connection
        const connection = activeConnections.get(socket.id);
        if (connection && connection.userId) {
          // Remove socket from user connections
          const userSockets = userConnections.get(connection.userId);
          if (userSockets) {
            const updatedSockets = userSockets.filter(id => id !== socket.id);
            if (updatedSockets.length > 0) {
              userConnections.set(connection.userId, updatedSockets);
            } else {
              userConnections.delete(connection.userId);
            }
          }
        }
        
        // Remove from active connections
        activeConnections.delete(socket.id);
      });
    });
  },
  
  // Emit to specific room
  emitToRoom: (room: string, event: string, data: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting to room', { room, event });
      io.to(room).emit(event, data);
    }
  },
  
  // Emit to specific user
  emitToUser: (userId: string, event: string, data: any) => {
    const io = getIO();
    if (io) {
      const userSockets = userConnections.get(userId);
      if (userSockets) {
        userSockets.forEach(socketId => {
          const connection = activeConnections.get(socketId);
          if (connection) {
            logger.info('Emitting to user', { userId, event });
            connection.socket.emit(event, data);
          }
        });
      }
    }
  },
  
  // Emit match state update
  emitMatchState: (matchId: string, state: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting match state update', { matchId });
      io.to(`match:${matchId}`).emit('match:state', state);
    }
  },
  
  // Emit match event
  emitMatchEvent: (matchId: string, event: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting match event', { matchId, event });
      io.to(`match:${matchId}`).emit('match:event', event);
    }
  },
  
  // Emit match commentary
  emitMatchCommentary: (matchId: string, commentary: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting match commentary', { matchId, commentary });
      io.to(`match:${matchId}`).emit('match:commentary', commentary);
    }
  },
  
  // Emit match stats
  emitMatchStats: (matchId: string, stats: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting match stats', { matchId, stats });
      io.to(`match:${matchId}`).emit('match:stats', stats);
    }
  },
  
  // Emit admin user activity
  emitAdminUserActivity: (activity: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting admin user activity', { activity });
      io.to('admin').emit('admin:user_activity', activity);
    }
  },
  
  // Emit admin system alert
  emitAdminSystemAlert: (alert: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting admin system alert', { alert });
      io.to('admin').emit('admin:system_alert', alert);
    }
  },
  
  // Emit admin logger status
  emitAdminLoggerStatus: (status: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting admin logger status', { status });
      io.to('admin').emit('admin:logger_status', status);
    }
  },
  
  // Emit notification
  emitNotification: (userId: string, notification: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting notification', { userId, notification });
      io.to(`user:${userId}`).emit('notification:new', notification);
    }
  },
  
  // Emit notification read
  emitNotificationRead: (userId: string, notificationId: string) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting notification read', { userId, notificationId });
      io.to(`user:${userId}`).emit('notification:read', notificationId);
    }
  },
  
  // Emit live metrics
  emitLiveMetrics: (metrics: any) => {
    const io = getIO();
    if (io) {
      logger.info('Emitting live metrics');
      io.to('analytics:liveMetrics').emit('analytics:liveMetrics', metrics);
    }
  },
  
  // Get active connections count
  getActiveConnectionsCount: (): number => {
    return activeConnections.size;
  },
  
  // Get user connections count
  getUserConnectionsCount: (): number => {
    return userConnections.size;
  },
  
  // Get connection health stats
  getConnectionHealthStats: (): any => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    let healthyConnections = 0;
    let staleConnections = 0;
    
    activeConnections.forEach(connection => {
      if (connection.lastPing >= fiveMinutesAgo) {
        healthyConnections++;
      } else {
        staleConnections++;
      }
    });
    
    return {
      total: activeConnections.size,
      healthy: healthyConnections,
      stale: staleConnections,
      users: userConnections.size
    };
  },
  
  // Get chat history for a match
  getChatHistory: async (matchId: string, limit: number = 50, offset: number = 0) => {
    try {
      logger.info('Fetching chat history', { matchId, limit, offset });
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          user_id,
          users:user_id (
            id,
            username,
            avatar
          )
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (error) {
        logger.error('Database error fetching chat history', { error: error.message, matchId });
        throw new Error(`Failed to fetch chat history: ${error.message}`);
      }
      
      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      logger.error('Get chat history error', error);
      throw error;
    }
  },
  
  // Delete chat message (admin/moderator function)
  deleteChatMessage: async (messageId: string, userId: string) => {
    try {
      logger.info('Deleting chat message', { messageId, userId });
      
      const { data, error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Chat message not found or unauthorized');
        }
        logger.error('Database error deleting chat message', { error: error.message, messageId });
        throw new Error(`Failed to delete chat message: ${error.message}`);
      }
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      logger.error('Delete chat message error', error);
      throw error;
    }
  },

  // Real-time analytics and statistics broadcasting
  
  // Broadcast user activity update
  broadcastUserActivity: (userId: string, activity: any) => {
    const io = getIO();
    if (io) {
      logger.info('Broadcasting user activity', { userId, activity });
      
      // Emit to admin dashboard
      io.to('admin').emit('analytics:userActivity', {
        userId,
        activity,
        timestamp: new Date()
      });
      
      // Emit to analytics dashboards
      io.to('analytics:liveMetrics').emit('analytics:activityUpdate', {
        type: 'user_activity',
        userId,
        activity,
        timestamp: new Date()
      });
    }
  },
  
  // Broadcast statistics update
  broadcastStatisticsUpdate: (type: string, entityId: string, stats: any) => {
    const io = getIO();
    if (io) {
      logger.info('Broadcasting statistics update', { type, entityId });
      
      // Emit to relevant rooms
      io.to('analytics:liveMetrics').emit('analytics:statisticsUpdate', {
        type,
        entityId,
        stats,
        timestamp: new Date()
      });
      
      // Emit to specific entity rooms if applicable
      if (type === 'team') {
        io.to(`team:${entityId}`).emit('team:statsUpdate', stats);
      } else if (type === 'match') {
        io.to(`match:${entityId}`).emit('match:statsUpdate', stats);
      }
    }
  },
  
  // Broadcast engagement metrics update
  broadcastEngagementUpdate: async (userId?: string) => {
    const io = getIO();
    if (io) {
      try {
        let engagementData;
        
        if (userId) {
          // Get specific user engagement
          engagementData = await cacheService.cacheUserEngagement(userId, true);
          
          // Emit to user-specific rooms
          io.to(`user:${userId}`).emit('analytics:engagementUpdate', {
            userId,
            engagement: engagementData,
            timestamp: new Date()
          });
        } else {
          // Get overall engagement metrics
          const realtimeMetrics = await cacheService.cacheRealtimeMetrics(true);
          
          // Emit to analytics dashboards
          io.to('analytics:liveMetrics').emit('analytics:overallEngagement', {
            metrics: realtimeMetrics,
            timestamp: new Date()
          });
        }
        
        // Always emit to admin
        io.to('admin').emit('analytics:engagementUpdate', {
          userId,
          engagement: engagementData,
          timestamp: new Date()
        });
        
      } catch (error: any) {
        logger.error('Error broadcasting engagement update', error);
      }
    }
  },
  
  // Broadcast performance metrics
  broadcastPerformanceMetrics: (metrics: any) => {
    const io = getIO();
    if (io) {
      logger.info('Broadcasting performance metrics');
      
      io.to('admin').emit('analytics:performanceMetrics', {
        metrics,
        timestamp: new Date()
      });
      
      io.to('analytics:liveMetrics').emit('analytics:performanceUpdate', {
        metrics,
        timestamp: new Date()
      });
    }
  },
  
  // Broadcast cache statistics
  broadcastCacheStats: async () => {
    const io = getIO();
    if (io) {
      try {
        const cacheStats = await cacheService.getStats();
        
        io.to('admin').emit('analytics:cacheStats', {
          stats: cacheStats,
          timestamp: new Date()
        });
        
      } catch (error: any) {
        logger.error('Error broadcasting cache stats', error);
      }
    }
  },
  
  // Broadcast system health update
  broadcastSystemHealth: (healthData: any) => {
    const io = getIO();
    if (io) {
      logger.info('Broadcasting system health update');
      
      io.to('admin').emit('system:healthUpdate', {
        health: healthData,
        connections: websocketService.getConnectionHealthStats(),
        timestamp: new Date()
      });
    }
  },
  
  // Broadcast activity heatmap update
  broadcastActivityHeatmap: async (days: number = 7) => {
    const io = getIO();
    if (io) {
      try {
        const { data, error } = await supabase.rpc('generate_activity_heatmap', { p_days: days });
        
        const result = { success: !error, data: error ? null : [{ heatmap: data }] };
        
        if (result.success && result.data && result.data[0]?.heatmap) {
          io.to('analytics:liveMetrics').emit('analytics:activityHeatmap', {
            heatmap: result.data[0].heatmap,
            days,
            timestamp: new Date()
          });
        }
        
      } catch (error: any) {
        logger.error('Error broadcasting activity heatmap', error);
      }
    }
  },
  
  // Start real-time analytics broadcasting
  startAnalyticsBroadcasting: () => {
    logger.info('Starting real-time analytics broadcasting');
    
    // Broadcast real-time metrics every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await cacheService.cacheRealtimeMetrics(true);
        websocketService.emitLiveMetrics(metrics);
      } catch (error: any) {
        logger.error('Error in real-time metrics broadcast', error);
      }
    }, 30000);
    
    // Broadcast cache stats every 5 minutes
    setInterval(async () => {
      await websocketService.broadcastCacheStats();
    }, 300000);
    
    // Broadcast activity heatmap every 10 minutes
    setInterval(async () => {
      await websocketService.broadcastActivityHeatmap(7);
    }, 600000);
    
    // Broadcast system health every 2 minutes
    setInterval(() => {
      const healthData = {
        activeConnections: websocketService.getActiveConnectionsCount(),
        userConnections: websocketService.getUserConnectionsCount(),
        connectionHealth: websocketService.getConnectionHealthStats(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
      
      websocketService.broadcastSystemHealth(healthData);
    }, 120000);
  },
  
  // Handle match event with statistics update
  handleMatchEventWithStats: async (matchId: string, event: any) => {
    const io = getIO();
    if (io) {
      try {
        // Emit the match event
        websocketService.emitMatchEvent(matchId, event);
        
        // Update and broadcast team statistics if applicable
        if (event.team_id) {
          // Invalidate team cache to force refresh
          await cacheService.invalidateTeamCaches(event.team_id);
          
          // Get fresh team stats
          const teamStats = await cacheService.cacheTeamStats(event.team_id, true);
          
          // Broadcast the update
          websocketService.broadcastStatisticsUpdate('team', event.team_id, teamStats);
        }
        
        // Update match statistics
        const { data: matchData, error: matchError } = await supabase
          .from('team_statistics')
          .select('*')
          .in('team_id', [
            supabase.from('Match').select('home_team_id').eq('id', matchId),
            supabase.from('Match').select('away_team_id').eq('id', matchId)
          ]);
        
        const matchStats = { success: !matchError, data: matchData };
        
        if (matchStats.success && matchStats.data) {
          websocketService.broadcastStatisticsUpdate('match', matchId, matchStats.data);
        }
        
      } catch (error: any) {
        logger.error('Error handling match event with stats', error);
      }
    }
  },
  
  // Handle user activity with analytics
  handleUserActivityWithAnalytics: async (userId: string, activity: any, ipAddress?: string, userAgent?: string) => {
    try {
      // Log the activity with enhanced audit trail
      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          action: activity.action,
          details: activity.details || {},
          ip_address: ipAddress,
          user_agent: userAgent
        });
      
      if (error) {
        throw new Error(`Failed to log user activity: ${error.message}`);
      }
      
      // Invalidate user caches
      await cacheService.invalidateUserCaches(userId);
      
      // Broadcast the activity
      websocketService.broadcastUserActivity(userId, {
        ...activity,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });
      
      // Update and broadcast engagement metrics
      await websocketService.broadcastEngagementUpdate(userId);
      
    } catch (error: any) {
      logger.error('Error handling user activity with analytics', error);
    }
  }
};