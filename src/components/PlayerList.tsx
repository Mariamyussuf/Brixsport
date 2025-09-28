import React, { useState, useEffect } from 'react';
import { Player } from '@/types/brixsports';
import playerService from '@/services/playerService';
import PlayerProfile from './PlayerProfile';

interface PlayerListProps {
  sport?: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  teamId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'RETIRED';
}

const PlayerList: React.FC<PlayerListProps> = ({ sport, teamId, status }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(20);

  useEffect(() => {
    fetchPlayers();
  }, [sport, teamId, status, currentPage, searchTerm]);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        page: currentPage,
        limit
      };
      
      if (sport) params.sport = sport;
      if (teamId) params.teamId = teamId;
      if (status) params.status = status;
      if (searchTerm) params.search = searchTerm;
      
      const response = await playerService.getPlayers(params);
      
      if (response.success) {
        setPlayers(response.data.players);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.error?.message || 'Failed to fetch players');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">Error: {error}</p>
        <button
          onClick={fetchPlayers}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {sport ? `${sport} Players` : 'All Players'}
        </h1>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={handleSearch}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      
      {players.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No players found matching your search.' : 'No players found.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <div 
                key={player.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    {player.profilePictureUrl ? (
                      <img 
                        src={player.profilePictureUrl} 
                        alt={`${player.firstName} ${player.lastName}`} 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                          {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {player.displayName || `${player.firstName} ${player.lastName}`}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {player.position || 'Position not specified'}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {player.nationality} • {player.sport}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      player.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : player.status === 'INACTIVE' 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
                          : player.status === 'SUSPENDED' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {player.status}
                    </span>
                    
                    {player.teamId && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Team: {player.teamId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Previous
              </button>
              
              <span className="text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlayerList;