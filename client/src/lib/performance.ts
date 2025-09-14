// Performance monitoring utilities
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track page load performance
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const loadTime = performance.now();
      this.recordMetric(`page_load_${pageName}`, loadTime);
      
      // Log performance if it's slow (over 2 seconds)
      if (loadTime > 2000) {
        console.warn(`Slow page load detected: ${pageName} took ${loadTime.toFixed(2)}ms`);
      }
    }
  }

  // Track API response times
  trackAPICall(endpoint: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.recordMetric(`api_${endpoint}`, duration);
    
    // Log slow API calls (over 1 second)
    if (duration > 1000) {
      console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }

  // Track component render times
  trackRender(componentName: string, renderTime: number) {
    this.recordMetric(`render_${componentName}`, renderTime);
    
    // Log slow renders (over 100ms)
    if (renderTime > 100) {
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  private recordMetric(key: string, value: number) {
    const existing = this.metrics.get(key) || [];
    existing.push(value);
    
    // Keep only last 10 measurements to avoid memory leaks
    if (existing.length > 10) {
      existing.shift();
    }
    
    this.metrics.set(key, existing);
  }

  // Get performance stats
  getStats(key: string) {
    const values = this.metrics.get(key) || [];
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  // Get all current metrics
  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [key, _] of Array.from(this.metrics.entries())) {
      stats[key] = this.getStats(key);
    }
    return stats;
  }

  // Log performance summary (useful for debugging)
  logSummary() {
    console.group('🚀 Performance Summary');
    const stats = this.getAllStats();
    
    Object.entries(stats).forEach(([key, data]) => {
      if (data && data.avg > 50) { // Only show metrics over 50ms
        console.log(`${key}: avg ${data.avg.toFixed(1)}ms (min: ${data.min.toFixed(1)}ms, max: ${data.max.toFixed(1)}ms)`);
      }
    });
    
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();
  
  return {
    trackRender: () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackRender(componentName, renderTime);
    },
    trackPageLoad: () => performanceMonitor.trackPageLoad(componentName)
  };
}

// Enhanced API request wrapper with performance tracking
export async function trackAPIRequest(url: string, fetchFn: () => Promise<Response>): Promise<Response> {
  const startTime = performance.now();
  try {
    const response = await fetchFn();
    performanceMonitor.trackAPICall(url, startTime);
    return response;
  } catch (error) {
    performanceMonitor.trackAPICall(`${url}_error`, startTime);
    throw error;
  }
}