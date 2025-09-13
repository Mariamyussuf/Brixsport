'use client';

import React from 'react';
import { useI18n } from '@/components/shared/I18nProvider';
import Link from 'next/link';
import { useCompetitions } from '@/hooks/useCompetitions';
import { RefreshCw } from 'lucide-react';

const CompetitionPage = () => {
  const { t } = useI18n();
  const { competitions, loading, error, refreshCompetitions } = useCompetitions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-4 max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('error')}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={refreshCompetitions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {t('try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('competitions')}</h1>
          <button
            onClick={refreshCompetitions}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label={t('refresh')}
          >
            <RefreshCw className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
        </div>
        
        {competitions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">{t('no_competitions_found')}</p>
          </div>
        ) : (
          <section>
            <div className="space-y-2 sm:space-y-3">
              {competitions.map((comp) => (
                <Link 
                  key={comp.id}
                  href={`/competition/${comp.id}`}
                  className="block w-full bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation active:scale-[0.98]"
                >
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">{comp.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                    {comp.category || comp.type || t('competition')}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CompetitionPage;