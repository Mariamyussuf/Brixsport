'use client';

import { useEffect, useState } from 'react';

export default function TestMatchesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Test direct API call
        const response = await fetch('/api/matches');
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch matches');
        }
        
        setData(result);
      } catch (err) {
        console.error('Test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Matches API Test</h1>
      
      {loading && (
        <div className="text-lg">Loading...</div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {data && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h2 className="font-bold">Success:</h2>
          <p>Received {data.matches?.length || 0} matches</p>
          <pre className="mt-2 text-xs overflow-auto max-h-64">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Diagnostic Steps:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Check browser console for network errors</li>
          <li>Verify Supabase environment variables are set correctly</li>
          <li>Check if the Match table exists in the database</li>
          <li>Verify database connection settings</li>
          <li>Check server logs for detailed error information</li>
        </ol>
      </div>
    </div>
  );
}