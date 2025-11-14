/**
 * Cache Warming Strategies
 * Proactively populate cache with frequently accessed data
 */

export interface WarmingStrategy {
  name: string;
  priority: number; // 1-10, higher = more important
  execute: () => Promise<void>;
  schedule?: string; // Cron expression
  enabled: boolean;
}

export interface WarmingStats {
  strategyName: string;
  lastRun: number | null;
  lastDuration: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
}

export class CacheWarmer {
  private strategies: Map<string, WarmingStrategy> = new Map();
  private stats: Map<string, WarmingStats> = new Map();
  private isWarming: boolean = false;
  private warmingInterval?: NodeJS.Timeout;

  /**
   * Register a warming strategy
   */
  registerStrategy(strategy: WarmingStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.stats.set(strategy.name, {
      strategyName: strategy.name,
      lastRun: null,
      lastDuration: 0,
      successCount: 0,
      failureCount: 0,
      averageDuration: 0
    });
  }

  /**
   * Unregister a warming strategy
   */
  unregisterStrategy(name: string): void {
    this.strategies.delete(name);
    this.stats.delete(name);
  }

  /**
   * Warm cache using all enabled strategies
   */
  async warmAll(): Promise<void> {
    if (this.isWarming) {
      console.log('[CacheWarmer] Already warming, skipping...');
      return;
    }

    this.isWarming = true;
    console.log('[CacheWarmer] Starting cache warm-up');

    try {
      // Sort strategies by priority (highest first)
      const sortedStrategies = Array.from(this.strategies.values())
        .filter(s => s.enabled)
        .sort((a, b) => b.priority - a.priority);

      for (const strategy of sortedStrategies) {
        await this.executeStrategy(strategy);
      }

      console.log('[CacheWarmer] Cache warm-up completed');
    } catch (error) {
      console.error('[CacheWarmer] Error during cache warm-up:', error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm cache using specific strategy
   */
  async warmByStrategy(strategyName: string): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyName}`);
    }

    await this.executeStrategy(strategy);
  }

  /**
   * Start automatic warming on interval
   */
  startAutoWarming(intervalMs: number = 3600000): void {
    // Default: warm every hour
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }

    this.warmingInterval = setInterval(() => {
      this.warmAll().catch(error => {
        console.error('[CacheWarmer] Auto warming error:', error);
      });
    }, intervalMs);

    // Run immediately
    this.warmAll().catch(error => {
      console.error('[CacheWarmer] Initial warming error:', error);
    });

    console.log(`[CacheWarmer] Auto warming started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop automatic warming
   */
  stopAutoWarming(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = undefined;
      console.log('[CacheWarmer] Auto warming stopped');
    }
  }

  /**
   * Get warming statistics
   */
  getStats(): WarmingStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Get stats for specific strategy
   */
  getStrategyStats(name: string): WarmingStats | undefined {
    return this.stats.get(name);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    for (const stats of this.stats.values()) {
      stats.successCount = 0;
      stats.failureCount = 0;
      stats.averageDuration = 0;
      stats.lastDuration = 0;
      stats.lastRun = null;
    }
  }

  /**
   * Execute a single strategy
   */
  private async executeStrategy(strategy: WarmingStrategy): Promise<void> {
    const stats = this.stats.get(strategy.name)!;
    const startTime = Date.now();

    try {
      console.log(`[CacheWarmer] Executing strategy: ${strategy.name}`);
      await strategy.execute();
      
      const duration = Date.now() - startTime;
      stats.lastRun = Date.now();
      stats.lastDuration = duration;
      stats.successCount++;
      
      // Update rolling average
      stats.averageDuration = Math.round(
        (stats.averageDuration * (stats.successCount - 1) + duration) / stats.successCount
      );

      console.log(
        `[CacheWarmer] Strategy ${strategy.name} completed in ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      stats.failureCount++;
      stats.lastDuration = duration;
      
      console.error(
        `[CacheWarmer] Strategy ${strategy.name} failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  }
}

/**
 * Pre-defined warming strategies
 */
export class DefaultWarmingStrategies {
  /**
   * Create strategy to warm active user data
   */
  static createActiveUsersStrategy(
    fetchActiveUsers: () => Promise<string[]>,
    warmUserData: (userId: string) => Promise<void>
  ): WarmingStrategy {
    return {
      name: 'active-users',
      priority: 9,
      enabled: true,
      execute: async () => {
        const userIds = await fetchActiveUsers();
        await Promise.all(userIds.map(id => warmUserData(id)));
        console.log(`[Warming] Warmed ${userIds.length} active users`);
      }
    };
  }

  /**
   * Create strategy to warm popular content
   */
  static createPopularContentStrategy(
    fetchPopularContent: () => Promise<string[]>,
    warmContent: (contentId: string) => Promise<void>
  ): WarmingStrategy {
    return {
      name: 'popular-content',
      priority: 8,
      enabled: true,
      execute: async () => {
        const contentIds = await fetchPopularContent();
        await Promise.all(contentIds.map(id => warmContent(id)));
        console.log(`[Warming] Warmed ${contentIds.length} popular content items`);
      }
    };
  }

  /**
   * Create strategy to warm aggregated statistics
   */
  static createStatsStrategy(
    warmStats: () => Promise<void>
  ): WarmingStrategy {
    return {
      name: 'statistics',
      priority: 7,
      enabled: true,
      execute: async () => {
        await warmStats();
        console.log('[Warming] Warmed statistics data');
      }
    };
  }

  /**
   * Create strategy to warm recent activities
   */
  static createRecentActivitiesStrategy(
    warmActivities: (days: number) => Promise<void>
  ): WarmingStrategy {
    return {
      name: 'recent-activities',
      priority: 6,
      enabled: true,
      execute: async () => {
        await Promise.all([
          warmActivities(7),  // Last week
          warmActivities(30)  // Last month
        ]);
        console.log('[Warming] Warmed recent activities');
      }
    };
  }

  /**
   * Create strategy to warm team/player data
   */
  static createTeamDataStrategy(
    fetchTopTeams: () => Promise<string[]>,
    warmTeamData: (teamId: string) => Promise<void>
  ): WarmingStrategy {
    return {
      name: 'team-data',
      priority: 8,
      enabled: true,
      execute: async () => {
        const teamIds = await fetchTopTeams();
        await Promise.all(teamIds.map(id => warmTeamData(id)));
        console.log(`[Warming] Warmed ${teamIds.length} teams`);
      }
    };
  }

  /**
   * Create strategy to warm upcoming matches
   */
  static createUpcomingMatchesStrategy(
    warmUpcomingMatches: () => Promise<void>
  ): WarmingStrategy {
    return {
      name: 'upcoming-matches',
      priority: 9,
      enabled: true,
      execute: async () => {
        await warmUpcomingMatches();
        console.log('[Warming] Warmed upcoming matches');
      }
    };
  }
}

/**
 * Global cache warmer instance
 */
export const globalCacheWarmer = new CacheWarmer();
