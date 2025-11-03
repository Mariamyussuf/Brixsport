'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const BasketballScheduleImportPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const importSchedule = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/basketball-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          details: data.matches
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to import schedule',
          details: data.details
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Network error occurred',
        details: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Basketball Schedule Import
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Import the official basketball league schedule into the database
            </p>
          </div>
          
          <div className="p-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                Schedule Overview
              </h2>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 6 teams participating in the league</li>
                <li>• 15 regular season rounds</li>
                <li>• 2 semifinal playoff matches</li>
                <li>• 3 final matches</li>
                <li>• Special events: Draft Combine, Draft Night, All-Star Games</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={importSchedule}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing Schedule...
                  </span>
                ) : (
                  'Import Basketball Schedule'
                )}
              </button>
              
              <button
                onClick={() => router.push('/basketball-schedule')}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                View Schedule Page
              </button>
            </div>
            
            {result && (
              <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <h3 className={`text-lg font-medium ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'} mb-2`}>
                  {result.success ? 'Import Successful' : 'Import Failed'}
                </h3>
                <p className={`${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'} mb-3`}>
                  {result.message}
                </p>
                
                {result.details && (
                  <div className="mt-3 text-sm">
                    <pre className={`overflow-x-auto p-3 rounded ${result.success ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                How to Use
              </h2>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Click the "Import Basketball Schedule" button to add all matches to the database
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Wait for the import process to complete (this may take a few moments)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Check the results to confirm all matches were imported successfully
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Visit the schedule page to view the imported matches
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballScheduleImportPage;