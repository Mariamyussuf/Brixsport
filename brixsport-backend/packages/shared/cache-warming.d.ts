export interface WarmingStrategy {
    name: string;
    priority: number;
    execute: () => Promise<void>;
    schedule?: string;
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
export declare class CacheWarmer {
    private strategies;
    private stats;
    private isWarming;
    private warmingInterval?;
    registerStrategy(strategy: WarmingStrategy): void;
    unregisterStrategy(name: string): void;
    warmAll(): Promise<void>;
    warmByStrategy(strategyName: string): Promise<void>;
    startAutoWarming(intervalMs?: number): void;
    stopAutoWarming(): void;
    getStats(): WarmingStats[];
    getStrategyStats(name: string): WarmingStats | undefined;
    resetStats(): void;
    private executeStrategy;
}
export declare class DefaultWarmingStrategies {
    static createActiveUsersStrategy(fetchActiveUsers: () => Promise<string[]>, warmUserData: (userId: string) => Promise<void>): WarmingStrategy;
    static createPopularContentStrategy(fetchPopularContent: () => Promise<string[]>, warmContent: (contentId: string) => Promise<void>): WarmingStrategy;
    static createStatsStrategy(warmStats: () => Promise<void>): WarmingStrategy;
    static createRecentActivitiesStrategy(warmActivities: (days: number) => Promise<void>): WarmingStrategy;
    static createTeamDataStrategy(fetchTopTeams: () => Promise<string[]>, warmTeamData: (teamId: string) => Promise<void>): WarmingStrategy;
    static createUpcomingMatchesStrategy(warmUpcomingMatches: () => Promise<void>): WarmingStrategy;
}
export declare const globalCacheWarmer: CacheWarmer;
//# sourceMappingURL=cache-warming.d.ts.map