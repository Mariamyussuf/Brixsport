'use client';

import React from 'react';
import { useI18n } from '@/components/shared/I18nProvider';

const CompetitionPage = () => {
  const { t } = useI18n();

  // Using the same competition section that is in the Homescreen component
  const competitions = [
    { title: t('football_section'), desc: 'University football championship' },
    { title: t('basketball_section'), desc: 'University basketball championship' },
    { title: t('track_events'), desc: 'Athletic competitions and relay events' },
    { title: 'Volleyball Championship', desc: 'Inter-campus volleyball tournament' },
    { title: 'Table Tennis League', desc: 'Singles and doubles competitions' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('competitions')}</h1>
        </div>
        
        <section>
          <div className="space-y-2 sm:space-y-3">
            {competitions.map((comp, index) => (
              <button 
                key={index}
                className="w-full bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation active:scale-[0.98]"
              >
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">{comp.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{comp.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CompetitionPage;