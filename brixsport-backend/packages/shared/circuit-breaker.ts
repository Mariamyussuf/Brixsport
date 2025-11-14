/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring and breaking failing operations
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;    // Number of failures before opening
  successThreshold: number;    // Successes needed to close from half-open
  timeout: number;             // Time in ms before attempting half-open
  monitoringPeriod: number;    // Rolling window for failure tracking (ms)
  volumeThreshold: number;     // Minimum requests before circuit can open
  errorFilter?: (error: Error) => boolean; // Filter which errors count as failures
  slowCallThreshold?: number;  // Threshold in ms for slow calls to be considered failures
  slowCallRateThreshold?: number; // Percentage of slow calls that triggers circuit opening
  halfOpenMaxAttempts?: number; // Max attempts in half-open state before going back to open
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
  slowCalls: number;
  totalCalls: number;
  slowCallRate: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private totalRequests: number = 0;
  private rejectedRequests: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastStateChange: number = Date.now();
  private nextAttempt: number = Date.now();
  private failureTimestamps: number[] = [];
  private slowCalls: number = 0;
  private totalCalls: number = 0;
  private halfOpenAttempts: number = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions
  ) {
    // Set default values for new options
    this.options.slowCallThreshold = this.options.slowCallThreshold || 5000; // 5 seconds
    this.options.slowCallRateThreshold = this.options.slowCallRateThreshold || 50; // 50%
    this.options.halfOpenMaxAttempts = this.options.halfOpenMaxAttempts || 5;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    this.totalCalls++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should attempt to close
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
        this.lastStateChange = Date.now();
        console.log(`[CircuitBreaker:${this.name}] State changed to HALF_OPEN`);
      } else {
        this.rejectedRequests++;
        if (fallback) {
          console.log(`[CircuitBreaker:${this.name}] Circuit OPEN, using fallback`);
          return fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      // Check for slow calls
      if (duration > (this.options.slowCallThreshold || 5000)) {
        this.slowCalls++;
        this.onSlowCall();
      } else {
        this.onSuccess();
      }
      
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      
      // Use fallback if available
      if (fallback) {
        console.log(`[CircuitBreaker:${this.name}] Operation failed, using fallback`);
        return fallback();
      }
      
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    // If half-open, check if we can close the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.lastStateChange = Date.now();
        this.failures = 0;
        this.slowCalls = 0;
        this.failureTimestamps = [];
        console.log(`[CircuitBreaker:${this.name}] State changed to CLOSED`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    // Apply error filter if provided
    if (this.options.errorFilter && !this.options.errorFilter(error)) {
      return; // Don't count this error
    }

    this.lastFailureTime = Date.now();
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.failureTimestamps.push(Date.now());

    // Clean up old failure timestamps outside monitoring period
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);

    // If half-open, open circuit immediately on failure
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      // If we've exceeded max attempts in half-open, go back to open
      if (this.halfOpenAttempts >= (this.options.halfOpenMaxAttempts || 5)) {
        this.openCircuit();
        return;
      }
    }

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED) {
      const recentFailures = this.failureTimestamps.length;
      
      // Only open if we have enough volume and failures
      if (
        this.totalRequests >= this.options.volumeThreshold &&
        recentFailures >= this.options.failureThreshold
      ) {
        this.openCircuit();
      }
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.lastStateChange = Date.now();
    this.nextAttempt = Date.now() + this.options.timeout;
    console.log(
      `[CircuitBreaker:${this.name}] State changed to OPEN (failures: ${this.consecutiveFailures}, slow calls: ${this.slowCalls})`
    );
  }

  /**
   * Manually reset the circuit breaker
   */
  private onSlowCall(): void {
    // Check slow call rate
    if (this.totalCalls > 0) {
      const slowCallRate = (this.slowCalls / this.totalCalls) * 100;
      const threshold = this.options.slowCallRateThreshold || 50;
      
      if (slowCallRate > threshold) {
        // Treat high slow call rate as a failure
        this.failures++;
        this.consecutiveFailures++;
        this.failureTimestamps.push(Date.now());
        
        // Clean up old failure timestamps
        const cutoff = Date.now() - this.options.monitoringPeriod;
        this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
        
        // Check if we should open the circuit due to slow calls
        if (this.state === CircuitState.CLOSED) {
          const recentFailures = this.failureTimestamps.length;
          
          if (
            this.totalRequests >= this.options.volumeThreshold &&
            recentFailures >= this.options.failureThreshold
          ) {
            this.openCircuit();
          }
        }
      }
    }
  }
  
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.slowCalls = 0;
    this.totalCalls = 0;
    this.failureTimestamps = [];
    this.lastStateChange = Date.now();
    console.log(`[CircuitBreaker:${this.name}] Manually reset to CLOSED`);
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const slowCallRate = this.totalCalls > 0 ? (this.slowCalls / this.totalCalls) * 100 : 0;
    
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      totalRequests: this.totalRequests,
      rejectedRequests: this.rejectedRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
      slowCalls: this.slowCalls,
      totalCalls: this.totalCalls,
      slowCallRate: Math.round(slowCallRate * 100) / 100
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit breaker factory with default configurations
 */
export class CircuitBreakerFactory {
  private static breakers: Map<string, CircuitBreaker> = new Map();

  static create(
    name: string,
    options?: Partial<CircuitBreakerOptions>
  ): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const defaultOptions: CircuitBreakerOptions = {
      failureThreshold: 5,      // Open after 5 failures
      successThreshold: 2,      // Close after 2 successes
      timeout: 60000,           // 60 seconds before retry
      monitoringPeriod: 120000, // 2 minute rolling window
      volumeThreshold: 10,      // Need at least 10 requests
      ...options
    };

    const breaker = new CircuitBreaker(name, defaultOptions);
    this.breakers.set(name, breaker);
    return breaker;
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  static getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  static reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  static resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}
