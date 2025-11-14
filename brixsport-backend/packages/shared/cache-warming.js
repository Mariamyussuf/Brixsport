"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCacheWarmer = exports.DefaultWarmingStrategies = exports.CacheWarmer = void 0;
class CacheWarmer {
    constructor() {
        this.strategies = new Map();
        this.stats = new Map();
        this.isWarming = false;
    }
    registerStrategy(strategy) {
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
    unregisterStrategy(name) {
        this.strategies.delete(name);
        this.stats.delete(name);
    }
    async warmAll() {
        if (this.isWarming) {
            console.log('[CacheWarmer] Already warming, skipping...');
            return;
        }
        this.isWarming = true;
        console.log('[CacheWarmer] Starting cache warm-up');
        try {
            const sortedStrategies = Array.from(this.strategies.values())
                .filter(s => s.enabled)
                .sort((a, b) => b.priority - a.priority);
            for (const strategy of sortedStrategies) {
                await this.executeStrategy(strategy);
            }
            console.log('[CacheWarmer] Cache warm-up completed');
        }
        catch (error) {
            console.error('[CacheWarmer] Error during cache warm-up:', error);
        }
        finally {
            this.isWarming = false;
        }
    }
    async warmByStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Strategy not found: ${strategyName}`);
        }
        await this.executeStrategy(strategy);
    }
    startAutoWarming(intervalMs = 3600000) {
        if (this.warmingInterval) {
            clearInterval(this.warmingInterval);
        }
        this.warmingInterval = setInterval(() => {
            this.warmAll().catch(error => {
                console.error('[CacheWarmer] Auto warming error:', error);
            });
        }, intervalMs);
        this.warmAll().catch(error => {
            console.error('[CacheWarmer] Initial warming error:', error);
        });
        console.log(`[CacheWarmer] Auto warming started (interval: ${intervalMs}ms)`);
    }
    stopAutoWarming() {
        if (this.warmingInterval) {
            clearInterval(this.warmingInterval);
            this.warmingInterval = undefined;
            console.log('[CacheWarmer] Auto warming stopped');
        }
    }
    getStats() {
        return Array.from(this.stats.values());
    }
    getStrategyStats(name) {
        return this.stats.get(name);
    }
    resetStats() {
        for (const stats of this.stats.values()) {
            stats.successCount = 0;
            stats.failureCount = 0;
            stats.averageDuration = 0;
            stats.lastDuration = 0;
            stats.lastRun = null;
        }
    }
    async executeStrategy(strategy) {
        const stats = this.stats.get(strategy.name);
        const startTime = Date.now();
        try {
            console.log(`[CacheWarmer] Executing strategy: ${strategy.name}`);
            await strategy.execute();
            const duration = Date.now() - startTime;
            stats.lastRun = Date.now();
            stats.lastDuration = duration;
            stats.successCount++;
            stats.averageDuration = Math.round((stats.averageDuration * (stats.successCount - 1) + duration) / stats.successCount);
            console.log(`[CacheWarmer] Strategy ${strategy.name} completed in ${duration}ms`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            stats.failureCount++;
            stats.lastDuration = duration;
            console.error(`[CacheWarmer] Strategy ${strategy.name} failed after ${duration}ms:`, error);
            throw error;
        }
    }
}
exports.CacheWarmer = CacheWarmer;
class DefaultWarmingStrategies {
    static createActiveUsersStrategy(fetchActiveUsers, warmUserData) {
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
    static createPopularContentStrategy(fetchPopularContent, warmContent) {
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
    static createStatsStrategy(warmStats) {
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
    static createRecentActivitiesStrategy(warmActivities) {
        return {
            name: 'recent-activities',
            priority: 6,
            enabled: true,
            execute: async () => {
                await Promise.all([
                    warmActivities(7),
                    warmActivities(30)
                ]);
                console.log('[Warming] Warmed recent activities');
            }
        };
    }
    static createTeamDataStrategy(fetchTopTeams, warmTeamData) {
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
    static createUpcomingMatchesStrategy(warmUpcomingMatches) {
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
exports.DefaultWarmingStrategies = DefaultWarmingStrategies;
exports.globalCacheWarmer = new CacheWarmer();
//# sourceMappingURL=cache-warming.js.map