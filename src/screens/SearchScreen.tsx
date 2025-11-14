"use client";
import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SmartImage from '@/components/shared/SmartImage';
import { useSearch } from '@/hooks/useSearch';

interface FilterOption {
  id: 'all' | 'team' | 'player' | 'competition';
  active: boolean;
}

interface PlayerItem {
  id: string;
  name: string;
  team: string;
  sport: string;
  avatar: string;
  type: 'player';
}

interface CompetitionItem {
  id: string;
  name: string;
  league: string;
  type: 'competition';
}

interface TeamItem {
  id: string;
  name: string;
  logo: string;
  sport: string;
  type: 'team';
}

type FilterableItem = PlayerItem | CompetitionItem | TeamItem;

interface SportsFilterInterfaceProps {
  items?: FilterableItem[];
  onItemRemove?: (id: string) => void;
  onFilterChange?: (activeFilter: string) => void;
}

const SearchScreen: React.FC<SportsFilterInterfaceProps> = ({
  items = [],
  onItemRemove,
  onFilterChange
}) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterOption['id']>('all');
  const [selectedItems, setSelectedItems] = useState<FilterableItem[]>(items);
  const [query, setQuery] = useState('');
  const { results, loading, error, search } = useSearch();

  // Fetch search results when query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setSelectedItems([]);
        return;
      }

      try {
        await search({ 
          query: query.trim(),
          types: activeFilter === 'all' ? undefined : [activeFilter as 'players' | 'competitions' | 'teams'],
          limit: 20
        });
      } catch (err) {
        console.error('Search error:', err);
      }
    };

    const debounce = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, activeFilter, search]);

  // Update selected items when search results change
  useEffect(() => {
    if (results) {
      const newItems: FilterableItem[] = [];
      
      // Add players to results
      if (results.players) {
        results.players.forEach(player => {
          newItems.push({
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
            team: player.teamId || 'No Team',
            sport: player.sport,
            avatar: player.profilePictureUrl || '',
            type: 'player'
          });
        });
      }
      
      // Add teams to results
      if (results.teams) {
        results.teams.forEach(team => {
          newItems.push({
            id: team.id.toString(),
            name: team.name,
            logo: team.logo_url,
            sport: 'football',
            type: 'team'
          });
        });
      }
      
      // Add competitions to results
      if (results.competitions) {
        results.competitions.forEach(competition => {
          newItems.push({
            id: competition.id.toString(),
            name: competition.competition_name || 'Competition',
            league: 'League',
            type: 'competition'
          });
        });
      }
      
      setSelectedItems(newItems);
    }
  }, [results]);

  const filterOptions: FilterOption[] = [
    { id: 'all', active: activeFilter === 'all' },
    { id: 'team', active: activeFilter === 'team' },
    { id: 'player', active: activeFilter === 'player' },
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
    if (activeFilter === 'all') return selectedItems;
    if (activeFilter === 'player') return selectedItems.filter(item => item.type === 'player');
    if (activeFilter === 'team') return selectedItems.filter(item => item.type === 'team');
    if (activeFilter === 'competition') return selectedItems.filter(item => item.type === 'competition');
    return selectedItems;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Search Bar */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, teams, competitions..."
            className="block w-full pl-9 sm:pl-10 pr-10 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
          {query && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterClick(option.id)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                option.active
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {option.id.charAt(0).toUpperCase() + option.id.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1">
        {query && (
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
        )}

        {loading && (
          <div className="px-3 sm:px-4 py-8 sm:py-12 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Searching...</p>
          </div>
        )}

        {error && (
          <div className="px-3 sm:px-4 py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">Error: {error}</p>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredItems.length === 0 && !loading && query ? (
            <div className="px-3 sm:px-4 py-8 sm:py-12 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                No results found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 px-2">
                Try searching for something else
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/${item.type}/${item.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {item.type === 'player' ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <SmartImage
                            src={(item as PlayerItem).avatar}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : item.type === 'team' ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <div className="w-5 h-3 sm:w-6 sm:h-4 bg-blue-600 rounded"></div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <div className="w-5 h-3 sm:w-6 sm:h-4 bg-green-600 rounded"></div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start flex-col sm:flex-row sm:items-center sm:space-x-2">
                        <p className="text-sm sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <span className={`mt-1 sm:mt-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          item.type === 'player' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : item.type === 'team'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {item.type === 'player' ? 'Player' : item.type === 'team' ? 'Team' : 'Competition'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate">
                          {item.type === 'player' 
                            ? (item as PlayerItem).team 
                            : item.type === 'team'
                            ? (item as TeamItem).sport
                            : (item as CompetitionItem).league
                          }
                        </span>
                        {item.type === 'player' && (
                          <div className="flex items-center space-x-1 mt-0.5 sm:mt-0">
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center space-x-1">
                              <span>⚽</span>
                              <span>{(item as PlayerItem).sport}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                    className="ml-2 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchScreen;