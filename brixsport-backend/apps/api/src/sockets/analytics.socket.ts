import { logger } from '../utils/logger';
import { Server, Socket } from 'socket.io';
import { analyticsService } from '../services/analytics.service';
import { supabaseService } from '../services/supabase.service';

// Define types for the competition report
interface CompetitionReport {
  competitionId: string;
  competition: {
    id: string;
    name: string;
    // Add other competition properties as needed
  } | null;
  totalMatches: number;
  completedMatches: number;
  topScorers: Array<{
    playerId: string;
    playerName: string;
    goals: number;
    // Add other scorer properties as needed
  }>;
  teamStats: Array<{
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    // Add other team stats as needed
  }>;
}

interface CompetitionOverviewData {
  competitionId: string;
  name: string;
  totalMatches: number;
  completedMatches: number;
  totalTeams: number;
  topScorers: Array<{
    playerId: string;
    playerName: string;
    goals: number;
  }>;
  teamStats: Array<{
    teamId: string;
    teamName: string;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }>;
}

// Store interval ID for live metrics updates
let liveMetricsInterval: NodeJS.Timeout | null = null;

export const analyticsSocketHandler = (io: Server, socket: Socket) => {
  logger.info('Analytics socket handler initialized', { socketId: socket.id });
  
  // Handle analytics dashboard join
  socket.on('analytics:joinDashboard', async (dashboardId: string) => {
    try {
      logger.info('User joined analytics dashboard room', { socketId: socket.id, dashboardId });
      socket.join(`analytics:dashboard:${dashboardId}`);
      
      // Get dashboard data and send to user
      const dashboardResult = await supabaseService.getDashboard(dashboardId);
      if (dashboardResult.success) {
        socket.emit('analytics:dashboardData', dashboardResult.data);
      }
    } catch (error: any) {
      logger.error('Error joining analytics dashboard room', { error: error.message, dashboardId });
    }
  });
  
  // Handle analytics dashboard leave
  socket.on('analytics:leaveDashboard', (dashboardId: string) => {
    logger.info('User left analytics dashboard room', { socketId: socket.id, dashboardId });
    socket.leave(`analytics:dashboard:${dashboardId}`);
  });
  
  // Handle request for live metrics
  socket.on('analytics:requestLiveMetrics', async () => {
    try {
      logger.info('Live metrics request received', { socketId: socket.id });
      
      // Get live metrics from service
      const result = await analyticsService.getLiveMetrics();
      
      // Send metrics back to requester
      socket.emit('analytics:liveMetrics', result.data);
    } catch (error: any) {
      logger.error('Error fetching live metrics', error);
      socket.emit('analytics:error', { message: error.message });
    }
  });
  
  // Handle subscription to live metrics updates
  socket.on('analytics:subscribeLiveMetrics', () => {
    logger.info('User subscribed to live metrics updates', { socketId: socket.id });
    socket.join('analytics:liveMetrics');
    
    // Start live metrics updates if not already started
    if (!liveMetricsInterval) {
      startLiveMetricsUpdates(io);
    }
  });
  
  // Handle unsubscription from live metrics updates
  socket.on('analytics:unsubscribeLiveMetrics', () => {
    logger.info('User unsubscribed from live metrics updates', { socketId: socket.id });
    socket.leave('analytics:liveMetrics');
    
    // Stop live metrics updates if no clients are subscribed
    if (io.sockets.adapter.rooms.get('analytics:liveMetrics')?.size === 0) {
      stopLiveMetricsUpdates();
    }
  });
  
  // Handle request for user overview
  socket.on('analytics:requestUserOverview', async () => {
    try {
      logger.info('User overview request received', { socketId: socket.id });
      
      // Get user overview from service
      const result = await analyticsService.getUserOverview();
      
      // Send data back to requester
      socket.emit('analytics:userOverview', result.data);
    } catch (error: any) {
      logger.error('Error fetching user overview', error);
      socket.emit('analytics:error', { message: error.message });
    }
  });
  
  // Handle request for user activity
  socket.on('analytics:requestUserActivity', async () => {
    try {
      logger.info('User activity request received', { socketId: socket.id });
      
      // Get user activity from service
      const result = await analyticsService.getUserActivity();
      
      // Send data back to requester
      socket.emit('analytics:userActivity', result.data);
    } catch (error: any) {
      logger.error('Error fetching user activity', error);
      socket.emit('analytics:error', { message: error.message });
    }
  });
  
  // Handle request for sports performance
  socket.on('analytics:requestSportsPerformance', async () => {
    try {
      logger.info('Sports performance request received', { socketId: socket.id });
      
      // Get sports performance from service
      const result = await analyticsService.getSportsPerformance();
      
      // Send data back to requester
      socket.emit('analytics:sportsPerformance', result.data);
    } catch (error: any) {
      logger.error('Error fetching sports performance', error);
      socket.emit('analytics:error', { message: error.message });
    }
  });
  
  // Handle request for competition overview
  socket.on('analytics:requestCompetitionOverview', async () => {
    try {
      logger.info('Competition overview request received', { socketId: socket.id });
      
      // Get competition report from service
      const reportResult = await analyticsService.getCompetitionReport('default');
      
      if (reportResult.success && reportResult.data) {
        const reportData = reportResult.data as unknown as CompetitionReport;
        const competitionData = reportData.competition || { name: 'Default Competition' };
        
        const overviewData: CompetitionOverviewData = {
          competitionId: reportData.competitionId,
          name: competitionData.name || 'Default Competition',
          totalMatches: reportData.totalMatches || 0,
          completedMatches: reportData.completedMatches || 0,
          totalTeams: Array.isArray(reportData.teamStats) ? reportData.teamStats.length : 0,
          topScorers: Array.isArray(reportData.topScorers) 
            ? reportData.topScorers.map(scorer => ({
                playerId: scorer.playerId || '',
                playerName: scorer.playerName || 'Unknown Player',
                goals: scorer.goals || 0
              }))
            : [],
          teamStats: Array.isArray(reportData.teamStats)
            ? reportData.teamStats.map(team => ({
                teamId: team.teamId || '',
                teamName: team.teamName || 'Unknown Team',
                matchesPlayed: team.matchesPlayed || 0,
                wins: team.wins || 0,
                draws: team.draws || 0,
                losses: team.losses || 0,
                goalsFor: team.goalsFor || 0,
                goalsAgainst: team.goalsAgainst || 0
              }))
            : []
        };
        
        socket.emit('analytics:competitionOverview', overviewData);
      } else {
        socket.emit('analytics:competitionOverview', {
          competitionId: 'default',
          name: 'Default Competition',
          totalMatches: 0,
          totalTeams: 0,
          totalGoals: 0,
          averageAttendance: 0
        });
      }
    } catch (error: any) {
      logger.error('Error fetching competition overview', error);
      socket.emit('analytics:error', { message: error.message });
    }
  });
  
  // Handle real-time match analytics subscription
  socket.on('analytics:subscribeMatchAnalytics', (matchId: string) => {
    logger.info('User subscribed to match analytics', { socketId: socket.id, matchId });
    socket.join(`analytics:match:${matchId}`);
  });
  
  // Handle real-time match analytics unsubscription
  socket.on('analytics:unsubscribeMatchAnalytics', (matchId: string) => {
    logger.info('User unsubscribed from match analytics', { socketId: socket.id, matchId });
    socket.leave(`analytics:match:${matchId}`);
  });
};

// Function to start live metrics updates
const startLiveMetricsUpdates = (io: Server) => {
  logger.info('Starting live metrics updates');
  
  liveMetricsInterval = setInterval(async () => {
    try {
      // Get live metrics from service
      const result = await analyticsService.getLiveMetrics();
      
      // Broadcast to all users subscribed to live metrics
      io.to('analytics:liveMetrics').emit('analytics:liveMetrics', result.data);
    } catch (error: any) {
      logger.error('Error fetching live metrics for broadcast', error);
      io.to('analytics:liveMetrics').emit('analytics:error', { message: error.message });
    }
  }, 5000); // Update every 5 seconds
};

// Function to stop live metrics updates
const stopLiveMetricsUpdates = () => {
  logger.info('Stopping live metrics updates');
  
  if (liveMetricsInterval) {
    clearInterval(liveMetricsInterval);
    liveMetricsInterval = null;
  }
};