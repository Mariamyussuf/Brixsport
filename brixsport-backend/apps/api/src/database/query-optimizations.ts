// ==================================================
// QUERY OPTIMIZATION IMPROVEMENTS
// ==================================================

// Optimized: Replace multiple individual queries with batch operations
export const getOptimizedUserAnalytics = async () => {
  try {
    logger.info('Fetching optimized user analytics from Supabase');

    // Single query with window functions instead of multiple queries
    const { data, error } = await supabase
      .rpc('get_user_analytics_optimized')
      .select();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return {
      success: true,
      data: data || {}
    };
  } catch (error: any) {
    logger.error('Get optimized user analytics error', error);
    throw error;
  }
};

// Optimized: Use batch operations for multiple related queries
export const getBatchMatchesWithTeams = async (matchIds: string[]) => {
  try {
    logger.info('Fetching batch matches with teams', { count: matchIds.length });

    // Single query with IN clause instead of multiple queries
    const { data, error } = await supabase
      .from('Match')
      .select(`
        *,
        homeTeam:Team!homeTeamId(id, name, logo),
        awayTeam:Team!awayTeamId(id, name, logo),
        competition:Competition(id, name)
      `)
      .in('id', matchIds);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    logger.error('Batch matches query error', error);
    throw error;
  }
};

// ==================================================
// TYPE-SAFE INTERFACES (Replace 'any' types)
// ==================================================

interface DatabaseFilters {
  status?: string;
  type?: string;
  category?: string;
  competitionId?: string;
  teamId?: string;
  playerId?: string;
  name?: string;
  email?: string;
  page?: number;
  limit?: number;
}

interface CompetitionData {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: string;
  category?: string;
  status?: string;
}

interface MatchFilters extends DatabaseFilters {
  status?: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

// ==================================================
// OPTIMIZED SERVICE METHODS
// ==================================================

// Optimized listMatches with better type safety and query efficiency
export const listMatchesOptimized = async (filters: MatchFilters = {}): Promise<{ success: boolean; data: any[] }> => {
  try {
    logger.info('Fetching matches with optimized query', { filters });

    let query = supabase
      .from('Match')
      .select(`
        *,
        homeTeam:Team!homeTeamId(id, name, logo),
        awayTeam:Team!awayTeamId(id, name, logo),
        competition:Competition(id, name)
      `);

    // Apply filters efficiently
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.competitionId) {
      query = query.eq('competitionId', filters.competitionId);
    }

    // Use more efficient ordering
    query = query.order('startTime', { ascending: true });

    // Apply pagination if provided
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Transform data once instead of in every call
    const transformedData = data?.map(match => ({
      id: match.id,
      competition_id: match.competitionId,
      home_team_id: match.homeTeamId,
      away_team_id: match.awayTeamId,
      match_date: match.startTime,
      venue: match.venue,
      status: match.status,
      home_score: match.homeScore,
      away_score: match.awayScore,
      current_minute: match.currentMinute || 0,
      period: match.period,
      home_team_name: match.homeTeam?.name,
      home_team_logo: match.homeTeam?.logo,
      away_team_name: match.awayTeam?.name,
      away_team_logo: match.awayTeam?.logo,
      competition_name: match.competition?.name
    })) || [];

    return {
      success: true,
      data: transformedData
    };
  } catch (error: any) {
    logger.error('Optimized list matches error', error);
    throw error;
  }
};

// ==================================================
// CONNECTION POOLING CONFIGURATION
// ==================================================

// Optimized connection configuration for production
const createOptimizedSupabaseClient = () => {
  const clientConfig = {
    auth: {
      persistSession: false, // Disable session persistence for better performance
      autoRefreshToken: false, // Handle token refresh manually
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'brixsport-api',
      },
    },
    // Connection pool settings
    rest: {
      timeout: 10000, // 10 second timeout
    },
  };

  return createClient(supabaseUrl, supabaseKey, clientConfig);
};

// ==================================================
// ENHANCED CACHE STRATEGY
// ==================================================

// Improved cache with better invalidation and metrics
class OptimizedCacheService {
  private cache: Map<string, CachedItem<any>> = new Map();
  private maxSize: number = 2000; // Increased cache size
  private defaultTTL: number = 10 * 60 * 1000; // 10 minutes
  private hitCount: number = 0;
  private missCount: number = 0;

  // Get cache metrics
  getMetrics() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount),
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }

  // Enhanced cache cleanup with LRU strategy
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  // Enhanced makeSpace with better eviction strategy
  private makeSpace(): void {
    if (this.cache.size >= this.maxSize) {
      // Remove 20% of entries (increased from 10%)
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const removeCount = Math.ceil(this.maxSize * 0.2);
      for (let i = 0; i < removeCount; i++) {
        if (entries[i]) {
          this.cache.delete(entries[i][0]);
        }
      }
    }
  }

  // Optimized get with metrics
  get<T>(key: string): T | null {
    this.cleanupExpiredCache();

    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp <= cached.ttl) {
        this.hitCount++;
        return cached.value;
      } else {
        this.cache.delete(key);
      }
    }

    this.missCount++;
    return null;
  }

  // Enhanced set with validation
  set<T>(key: string, value: T, ttl?: number): void {
    if (!key || value === undefined) {
      logger.warn('Invalid cache set operation', { key, hasValue: value !== undefined });
      return;
    }

    this.cleanupExpiredCache();
    this.makeSpace();

    const cacheItem: CachedItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, cacheItem);
  }

  // Batch operations for better performance
  setBatch(items: Array<{ key: string; value: any; ttl?: number }>): void {
    items.forEach(item => this.set(item.key, item.value, item.ttl));
  }

  // Enhanced delete with pattern matching
  delete(keyPattern: string): number {
    let deletedCount = 0;

    if (keyPattern.includes('*')) {
      // Pattern matching for bulk deletion
      const pattern = keyPattern.replace('*', '');
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
    } else {
      if (this.cache.delete(keyPattern)) {
        deletedCount = 1;
      }
    }

    return deletedCount;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    const stats = {
      totalEntries: entries.length,
      expiredEntries: entries.filter(([_, item]) => now - item.timestamp > item.ttl).length,
      averageTTL: entries.reduce((sum, [_, item]) => sum + item.ttl, 0) / entries.length || 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([_, item]) => item.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([_, item]) => item.timestamp)) : null,
      metrics: this.getMetrics()
    };

    return stats;
  }
}

// Export optimized cache instance
export const optimizedCacheService = new OptimizedCacheService();
