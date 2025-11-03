'use client';

import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import BasketballSchedule from '@/components/BasketballSchedule';
import { useBasketballSchedule } from '@/hooks/useBasketballSchedule';
import { useI18n } from '@/components/shared/I18nProvider';

const BasketballSchedulePage = () => {
  const { t } = useI18n();
  const { schedule, loading, error, refreshSchedule } = useBasketballSchedule();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Schedule</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={refreshSchedule}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('basketball_section')} Schedule
            </h1>
            <button
              onClick={refreshSchedule}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div className="flex items-center mr-4">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span>Upcoming</span>
              </div>
              <div className="flex items-center mr-4">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span>Live</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>Completed</span>
              </div>
            </div>
            
            {schedule.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No schedule available
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The basketball schedule will be available soon.
                </p>
              </div>
            ) : (
              <BasketballSchedule rounds={schedule} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasketballSchedulePage;