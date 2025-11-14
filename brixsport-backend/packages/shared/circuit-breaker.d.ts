export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    monitoringPeriod: number;
    volumeThreshold: number;
    errorFilter?: (error: Error) => boolean;
}
export interface CircuitBreakerMetrics {
    state: CircuitState;
    failures: number;
    successes: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    totalRequests: number;
    rejectedRequests: number;
    lastFailureTime: number | null;
    lastSuccessTime: number | null;
    lastStateChange: number;
}
export declare class CircuitBreaker {
    private name;
    private options;
    private state;
    private failures;
    private successes;
    private consecutiveFailures;
    private consecutiveSuccesses;
    private totalRequests;
    private rejectedRequests;
    private lastFailureTime;
    private lastSuccessTime;
    private lastStateChange;
    private nextAttempt;
    private failureTimestamps;
    constructor(name: string, options: CircuitBreakerOptions);
    execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private openCircuit;
    reset(): void;
    getMetrics(): CircuitBreakerMetrics;
    getState(): CircuitState;
    isHealthy(): boolean;
}
export declare class CircuitBreakerFactory {
    private static breakers;
    static create(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker;
    static get(name: string): CircuitBreaker | undefined;
    static getAll(): Map<string, CircuitBreaker>;
    static reset(name: string): void;
    static resetAll(): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map