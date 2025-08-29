"use client";
import React, { useState } from 'react';
import { X, ArrowLeft, Bell, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SmartImage from '@/components/shared/SmartImage';
import { useI18n } from '@/components/shared/I18nProvider';

interface FilterOption {
  id: 'all' | 'team' | 'player' | 'match' | 'competition';
  active: boolean;
}

interface Player {
  id: string;
  name: string;
  team: string;
  sport: string;
  avatar: string;
  type: 'player';
}

interface Competition {
  id: string;
  name: string;
  league: string;
  logo: string;
  type: 'competition';
}

type FilterableItem = Player | Competition;

interface SportsFilterInterfaceProps {
  items?: FilterableItem[];
  onItemRemove?: (id: string) => void;
  onFilterChange?: (activeFilter: string) => void;
}

const SearchScreen: React.FC<SportsFilterInterfaceProps> = ({
  items = [
    {
      id: '1',
      name: 'Yanko',
      team: 'Joga FC',
      sport: 'Football',
      avatar: '/api/placeholder/40/40',
      type: 'player'
    },
    {
      id: '2',
      name: 'Yanko',
      team: 'Joga FC',
      sport: 'Football',
      avatar: '/api/placeholder/40/40',
      type: 'player'
    },
    {
      id: '3',
      name: 'Yanko',
      team: 'Joga FC',
      sport: 'Football',
      avatar: '/api/placeholder/40/40',
      type: 'player'
    },
    {
      id: '4',
      name: 'Play Ball Africa',
      league: 'School competition',
      logo: '/api/placeholder/40/40',
      type: 'competition'
    },
    {
      id: '5',
      name: 'Play Ball Africa',
      league: 'School competition',
      logo: '/api/placeholder/40/40',
      type: 'competition'
    },
    {
      id: '6',
      name: 'Play Ball Africa',
      league: 'School competition',
      logo: '/api/placeholder/40/40',
      type: 'competition'
    },
    {
      id: '7',
      name: 'Spartans',
      league: 'Busa League',
      logo: '/api/placeholder/40/40',
      type: 'competition'
    }
  ],
  onItemRemove,
  onFilterChange
}) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterOption['id']>('all');
  const [selectedItems, setSelectedItems] = useState<FilterableItem[]>(items);
  const [query, setQuery] = useState('');

  const filterOptions: FilterOption[] = [
    { id: 'all', active: activeFilter === 'all' },
    { id: 'team', active: activeFilter === 'team' },
    { id: 'player', active: activeFilter === 'player' },
    { id: 'match', active: activeFilter === 'match' },
    { id: 'competition', active: activeFilter === 'competition' }
  ];

  const handleFilterClick = (filterId: FilterOption['id']) => {
    setActiveFilter(filterId);
    onFilterChange?.(filterId);
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
    onItemRemove?.(id);
  };

  const getFilteredItems = () => {
    const byType = (() => {
      if (activeFilter === 'all') return selectedItems;
      if (activeFilter === 'player') return selectedItems.filter(item => item.type === 'player');
      if (activeFilter === 'competition') return selectedItems.filter(item => item.type === 'competition');
      return selectedItems;
    })();

    if (!query.trim()) return byType;
    const q = query.toLowerCase();
    return byType.filter(item => {
      if ('team' in item) {
        const p = item as Player;
        return (
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q) ||
          p.sport.toLowerCase().includes(q)
        );
      }
      const c = item as Competition;
      return (
        c.name.toLowerCase().includes(q) ||
        c.league.toLowerCase().includes(q)
      );
    });
  };

  const filteredItems = getFilteredItems();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/10 text-slate-900 dark:text-white px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t('app_title')}</h1>
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <button 
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Notifications"
            type="button"
          >
            <Bell className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900/40 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl px-3 py-2">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="ml-2 bg-transparent outline-none w-full text-sm sm:text-base placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-slate-900/40 border-y border-gray-200 dark:border-white/10 px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 shadow-sm">
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-4 overflow-x-auto scrollbar-hide lg:justify-center">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleFilterClick(option.id)}
                className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-full text-xs sm:text-sm lg:text-base xl:text-lg font-medium whitespace-nowrap transition-all duration-200 ${
                  option.active
                    ? 'bg-blue-900 text-white shadow-md hover:bg-blue-800'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:active:bg-white/20'
                }`}
              >
                {t(option.id)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="h-px bg-gray-200 dark:bg-white/10"></div>

      {/* Items List */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <p className="text-gray-500 dark:text-gray-300 text-base sm:text-lg lg:text-xl">{t('no_items_found')}</p>
            <p className="text-gray-400 dark:text-gray-400 text-sm sm:text-base lg:text-lg mt-2">{t('try_adjust_filter')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 sm:p-4 lg:p-6 bg-white dark:bg-slate-900/40 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 group border border-gray-100 dark:border-white/10"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5 min-w-0 flex-1">
                  {/* Avatar/Logo */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full overflow-hidden flex-shrink-0">
                    {item.type === 'player' ? (
                      <SmartImage
                        src={(item as Player).avatar}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <div className="w-6 h-4 sm:w-8 sm:h-6 lg:w-10 lg:h-7 xl:w-12 xl:h-8 bg-blue-600 rounded-sm"></div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base lg:text-lg xl:text-xl truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1 lg:mt-2">
                      <p className="text-gray-500 dark:text-gray-300 text-xs sm:text-sm lg:text-base xl:text-lg truncate">
                        {item.type === 'player' 
                          ? (item as Player).team 
                          : (item as Competition).league
                        }
                      </p>
                      {item.type === 'player' && (
                        <>
                          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full hidden sm:block"></div>
                          <span className="text-gray-400 dark:text-gray-400 text-xs sm:text-sm lg:text-base xl:text-lg hidden sm:inline">
                            ⚽ {(item as Player).sport}
                          </span>
                        </>
                      )}
                    </div>
                    {/* Mobile: Show sport on separate line for players */}
                    {item.type === 'player' && (
                      <p className="text-gray-400 dark:text-gray-400 text-xs mt-1 sm:hidden">
                        ⚽ {(item as Player).sport}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 flex items-center justify-center text-gray-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all duration-200 active:scale-95 flex-shrink-0 ml-2 sm:ml-3 lg:ml-4 group-hover:bg-gray-50 dark:group-hover:bg-white/10"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Items Counter */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-3 sm:bottom-4 lg:bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-blue-900 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200">
            <span className="text-xs sm:text-sm lg:text-base xl:text-lg font-medium">
              {filteredItems.length}/{selectedItems.length} {t('items')}
              {activeFilter !== 'all' && (
                <span className="hidden sm:inline">
                  {` (${t('filtered_by')} ${t(activeFilter)})`}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchScreen;