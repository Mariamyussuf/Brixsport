// Production monitoring and analytics setup
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  const sendToAnalytics = (metric: Metric) => {
    // Send to your analytics service (Google Analytics, Mixpanel, etc.)
    if (process.env.NEXT_PUBLIC_GA_ID && typeof gtag !== 'undefined') {
      // Google Analytics 4 example
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  };

  // Initialize web vitals monitoring
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics); // Interaction to Next Paint (replaces FID)
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// Error monitoring
export function initErrorMonitoring() {
  if (typeof window === 'undefined') return;

  // Global error handler
  window.addEventListener('error', (event) => {
    logError({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      type: 'javascript',
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    logError({
      message: event.reason?.message || 'Unhandled Promise Rejection',
      error: event.reason,
      type: 'promise',
    });
  });
}

// Performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // Monitor long tasks
  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        logPerformanceIssue({
          type: 'long-task',
          duration: entry.duration,
          startTime: entry.startTime,
          url: window.location.href,
        });
      }
    }
  });

  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long task API not supported
  }

  // Monitor navigation timing
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };

      logPerformanceMetrics(metrics);
    }
  });
}

// User interaction monitoring
export function initUserInteractionMonitoring() {
  if (typeof window === 'undefined') return;

  let interactionCount = 0;
  let sessionStart = Date.now();

  const trackInteraction = (type: string) => {
    interactionCount++;
    
    // Log engagement metrics every 10 interactions
    if (interactionCount % 10 === 0) {
      logUserEngagement({
        interactions: interactionCount,
        sessionDuration: Date.now() - sessionStart,
        type,
        url: window.location.href,
      });
    }
  };

  // Track clicks
  document.addEventListener('click', () => trackInteraction('click'));
  
  // Track keyboard interactions
  document.addEventListener('keydown', () => trackInteraction('keydown'));
  
  // Track scroll
  let scrollTimeout: NodeJS.Timeout;
  document.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => trackInteraction('scroll'), 100);
  });
}

// Logging functions
function logError(errorData: any) {
  console.error('Error logged:', errorData);
  
  // Send to monitoring service
  fetch('/api/monitoring/errors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...errorData,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(console.error);
}

function logPerformanceIssue(issueData: any) {
  console.warn('Performance issue:', issueData);
  
  fetch('/api/monitoring/performance-issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...issueData,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    }),
  }).catch(console.error);
}

function logPerformanceMetrics(metrics: any) {
  fetch('/api/monitoring/performance-metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(console.error);
}

function logUserEngagement(engagementData: any) {
  fetch('/api/monitoring/user-engagement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...engagementData,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    }),
  }).catch(console.error);
}

// Initialize all monitoring
export function initMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    initWebVitals();
    initErrorMonitoring();
    initPerformanceMonitoring();
    initUserInteractionMonitoring();
  }
}

// Declare gtag for TypeScript
declare global {
  function gtag(...args: any[]): void;
}
