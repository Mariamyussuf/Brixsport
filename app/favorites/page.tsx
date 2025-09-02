'use client';

import React from 'react';
import Favouritesscreen from '@/components/FootballScreen/Favouritesscreen';
import { useI18n } from '@/components/shared/I18nProvider';

const FavoritesPage = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('favorites')}</h1>
        </div>
        <Favouritesscreen activeSport="all" />
      </div>
    </div>
  );
};

export default FavoritesPage;