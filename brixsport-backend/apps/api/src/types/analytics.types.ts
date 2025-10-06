// Analytics & Reporting Types

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  entityId?: string;
  entityType?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface SystemLogEvent {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  component: string;
  message: string;
  metadata: Record<string, any>;
  timestamp: Date;
  correlationId?: string;
  tags?: string[]; // Tags like 'PR', 'DEPLOYMENT', 'SECURITY'
}

export interface Metric {
  name: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  changePercentage?: number;
  timeframe: 'realtime' | 'daily' | 'weekly' | 'monthly';
  category: 'user' | 'sports' | 'platform' | 'business' | 'system' | 'deployment';
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'user' | 'sports' | 'competition' | 'platform' | 'system' | 'deployment';
  parameters: Record<string, any>;
  data: any;
  format: 'json' | 'csv' | 'pdf';
  generatedAt: Date;
  expiresAt?: Date;
}

export interface Widget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'kpi';
  title: string;
  query: string;
  visualization: {
    type: string;
    options: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Analytics Types
export interface UserOverview {
  totalUsers: number;
  activeUsers: number;
  newUserRegistrations: number;
  userGrowthRate: number;
}

export interface UserActivity {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  sessionDuration: number;
  sessionsPerUser: number;
}

export interface GeographicDistribution {
  country: string;
  userCount: number;
  percentage: number;
}

export interface UserRetention {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

// Sports Analytics Types
export interface SportsPerformance {
  sport: string;
  totalEvents: number;
  totalParticipants: number;
  averageDuration: number;
  popularityScore: number;
}

export interface SportPopularity {
  sport: string;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  userInterest: number;
}

export interface ParticipationStatistics {
  sport: string;
  totalParticipants: number;
  newParticipants: number;
  retentionRate: number;
}

// Competition Analytics Types
export interface CompetitionOverview {
  competitionId: string;
  name: string;
  totalMatches: number;
  totalTeams: number;
  totalGoals: number;
  averageAttendance: number;
}

export interface FanEngagement {
  competitionId: string;
  socialMediaMentions: number;
  appEngagement: number;
  ticketSales: number;
  merchandiseSales: number;
}

export interface RevenueGeneration {
  competitionId: string;
  ticketRevenue: number;
  broadcastRevenue: number;
  sponsorshipRevenue: number;
  merchandiseRevenue: number;
  totalRevenue: number;
}

// Platform Analytics Types
export interface PlatformUsage {
  apiRequests: number;
  activeFeatures: number;
  featureAdoptionRate: number;
  userSatisfaction: number;
}

export interface SystemPerformance {
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
}

export interface ErrorTracking {
  errorType: string;
  count: number;
  affectedUsers: number;
  resolutionStatus: 'open' | 'in_progress' | 'resolved';
}

// System Monitoring Types
export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ResourceUtilization {
  resourceName: string;
  currentUsage: number;
  maxCapacity: number;
  utilizationPercentage: number;
}

export interface SystemAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

// Real-time Data Types
export interface LiveMetric {
  name: string;
  value: number;
  timestamp: Date;
}

export interface WebSocketConnection {
  id: string;
  userId?: string;
  connectedAt: Date;
  lastPing: Date;
}