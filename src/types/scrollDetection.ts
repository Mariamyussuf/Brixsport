export interface ScrollDetectionOptions {
    shrinkThreshold?: number;
    expandThreshold?: number;
  }
  
  export interface ScrollDetectionResult {
    isScrolled: boolean;
    scrollDirection: 'up' | 'down' | null;
  }