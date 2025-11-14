"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerFactory = exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    constructor(name, options) {
        this.name = name;
        this.options = options;
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.totalRequests = 0;
        this.rejectedRequests = 0;
        this.lastFailureTime = null;
        this.lastSuccessTime = null;
        this.lastStateChange = Date.now();
        this.nextAttempt = Date.now();
        this.failureTimestamps = [];
    }
    async execute(fn, fallback) {
        this.totalRequests++;
        if (this.state === CircuitState.OPEN) {
            if (Date.now() >= this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
                this.lastStateChange = Date.now();
                console.log(`[CircuitBreaker:${this.name}] State changed to HALF_OPEN`);
            }
            else {
                this.rejectedRequests++;
                if (fallback) {
                    console.log(`[CircuitBreaker:${this.name}] Circuit OPEN, using fallback`);
                    return fallback();
                }
                throw new Error(`Circuit breaker is OPEN for ${this.name}`);
            }
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure(error);
            if (fallback) {
                console.log(`[CircuitBreaker:${this.name}] Operation failed, using fallback`);
                return fallback();
            }
            throw error;
        }
    }
    onSuccess() {
        this.lastSuccessTime = Date.now();
        this.successes++;
        this.consecutiveSuccesses++;
        this.consecutiveFailures = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            if (this.consecutiveSuccesses >= this.options.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.lastStateChange = Date.now();
                this.failures = 0;
                this.failureTimestamps = [];
                console.log(`[CircuitBreaker:${this.name}] State changed to CLOSED`);
            }
        }
    }
    onFailure(error) {
        if (this.options.errorFilter && !this.options.errorFilter(error)) {
            return;
        }
        this.lastFailureTime = Date.now();
        this.failures++;
        this.consecutiveFailures++;
        this.consecutiveSuccesses = 0;
        this.failureTimestamps.push(Date.now());
        const cutoff = Date.now() - this.options.monitoringPeriod;
        this.failureTimestamps = this.failureTimestamps.filter(ts => ts > cutoff);
        if (this.state === CircuitState.HALF_OPEN) {
            this.openCircuit();
            return;
        }
        if (this.state === CircuitState.CLOSED) {
            const recentFailures = this.failureTimestamps.length;
            if (this.totalRequests >= this.options.volumeThreshold &&
                recentFailures >= this.options.failureThreshold) {
                this.openCircuit();
            }
        }
    }
    openCircuit() {
        this.state = CircuitState.OPEN;
        this.lastStateChange = Date.now();
        this.nextAttempt = Date.now() + this.options.timeout;
        console.log(`[CircuitBreaker:${this.name}] State changed to OPEN (failures: ${this.consecutiveFailures})`);
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.failureTimestamps = [];
        this.lastStateChange = Date.now();
        console.log(`[CircuitBreaker:${this.name}] Manually reset to CLOSED`);
    }
    getMetrics() {
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
            lastStateChange: this.lastStateChange
        };
    }
    getState() {
        return this.state;
    }
    isHealthy() {
        return this.state === CircuitState.CLOSED;
    }
}
exports.CircuitBreaker = CircuitBreaker;
class CircuitBreakerFactory {
    static create(name, options) {
        if (this.breakers.has(name)) {
            return this.breakers.get(name);
        }
        const defaultOptions = {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 60000,
            monitoringPeriod: 120000,
            volumeThreshold: 10,
            ...options
        };
        const breaker = new CircuitBreaker(name, defaultOptions);
        this.breakers.set(name, breaker);
        return breaker;
    }
    static get(name) {
        return this.breakers.get(name);
    }
    static getAll() {
        return this.breakers;
    }
    static reset(name) {
        const breaker = this.breakers.get(name);
        if (breaker) {
            breaker.reset();
        }
    }
    static resetAll() {
        this.breakers.forEach(breaker => breaker.reset());
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
CircuitBreakerFactory.breakers = new Map();
//# sourceMappingURL=circuit-breaker.js.map