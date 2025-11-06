'use client';

import { useEffect, useState } from 'react';

export default function HealthCheckPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Test health check endpoint
        const response = await fetch('/api/health');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error?.message || 'Health check failed');
        }
        
        setData(result);
      } catch (err) {
        console.error('Health check failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">System Health Check</h1>
      
      {loading && (
        <div className="text-lg">Checking system health...</div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {data && (
        <div className={`border px-4 py-3 rounded ${data.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
          <h2 className="font-bold">Health Check Result:</h2>
          {data.success ? (
            <div>
              <p>System Status: <span className="font-semibold">Healthy</span></p>
              <p>Supabase Connection: <span className="font-semibold">{data.data?.supabase}</span></p>
              <p>Matches in Database: <span className="font-semibold">{data.data?.matches}</span></p>
              <p>Timestamp: <span className="font-semibold">{data.data?.timestamp}</span></p>
            </div>
          ) : (
            <div>
              <p>System Status: <span className="font-semibold">Unhealthy</span></p>
              <p>Error: <span className="font-semibold">{data.error?.message}</span></p>
              {data.error?.details && (
                <p>Details: <span className="font-semibold">{data.error?.details}</span></p>
              )}
              {data.error?.code && (
                <p>Code: <span className="font-semibold">{data.error?.code}</span></p>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Guide:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>If Supabase connection fails, verify environment variables are set correctly</li>
          <li>If matches fetch fails, check if the Match table exists in the database</li>
          <li>Check server logs for detailed error information</li>
          <li>Verify database connection settings in the environment configuration</li>
        </ul>
      </div>
    </div>
  );
}