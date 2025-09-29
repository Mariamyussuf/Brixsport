'use client';

import { useEffect } from 'react';
import { initMonitoring } from '@/lib/monitoring';

const MonitoringInitializer = () => {
  useEffect(() => {
    // Initialize monitoring only in production and on client side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      initMonitoring();
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default MonitoringInitializer;
