import React from 'react';
import { Player, CareerStats } from '@/types/brixsports';

interface PlayerProfileProps {
  player: Player;
  stats?: CareerStats;
  onEdit?: () => void;
  onDelete?: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, stats, onEdit, onDelete }) => {
  const getFullName = () => {
    return player.displayName || `${player.firstName} ${player.lastName}`;
  };

  const renderSocialMediaLinks = () => {
    if (!player.socialMediaLinks) return null;
    
    return (
      <div className="flex space-x-2">
        {player.socialMediaLinks.twitter && (
          <a 
            href={player.socialMediaLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600"
          >
            Twitter
          </a>
        )}
        {player.socialMediaLinks.instagram && (
          <a 
            href={player.socialMediaLinks.instagram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-600"
          >
            Instagram
          </a>
        )}
        {player.socialMediaLinks.facebook && (
          <a 
            href={player.socialMediaLinks.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Facebook
          </a>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!stats) return null;
    
    if (player.sport === 'FOOTBALL' && stats.football) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Goals</p>
            <p className="text-2xl font-bold">{stats.football.goals || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Assists</p>
            <p className="text-2xl font-bold">{stats.football.assists || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Matches</p>
            <p className="text-2xl font-bold">{stats.football.matchesPlayed || 0}</p>
          </div>
          {stats.football.yellowCards !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Yellow Cards</p>
              <p className="text-2xl font-bold">{stats.football.yellowCards}</p>
            </div>
          )}
          {stats.football.redCards !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Red Cards</p>
              <p className="text-2xl font-bold">{stats.football.redCards}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (player.sport === 'BASKETBALL' && stats.basketball) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
            <p className="text-2xl font-bold">{stats.basketball.points || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Rebounds</p>
            <p className="text-2xl font-bold">{stats.basketball.rebounds || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Assists</p>
            <p className="text-2xl font-bold">{stats.basketball.assists || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Steals</p>
            <p className="text-2xl font-bold">{stats.basketball.steals || 0}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Blocks</p>
            <p className="text-2xl font-bold">{stats.basketball.blocks || 0}</p>
          </div>
        </div>
      );
    }
    
    if (player.sport === 'TRACK' && stats.track) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Track Statistics</h3>
          {stats.track.personalBests && stats.track.personalBests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time/Distance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.track.personalBests.map((pb, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{pb.event}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {pb.time || pb.distance || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {pb.date ? new Date(pb.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {stats.track.medalsWon && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Gold</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.track.medalsWon.gold}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Silver</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.track.medalsWon.silver}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Bronze</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.track.medalsWon.bronze}</p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return <p className="text-gray-500 dark:text-gray-400">No statistics available</p>;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
          <div className="flex-shrink-0 mb-4 md:mb-0">
            {player.profilePictureUrl ? (
              <img 
                src={player.profilePictureUrl} 
                alt={getFullName()} 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {getFullName().split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getFullName()}</h1>
                <p className="text-gray-600 dark:text-gray-400">{player.position || 'Position not specified'}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {player.nationality} • {new Date(player.dateOfBirth).toLocaleDateString()} • {player.gender}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Status: <span className="font-medium">{player.status}</span>
                </p>
                {player.teamId && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Team ID: <span className="font-medium">{player.teamId}</span>
                  </p>
                )}
              </div>
              
              {(onEdit || onDelete) && (
                <div className="flex space-x-2 mt-2 sm:mt-0">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {renderSocialMediaLinks()}
            
            {player.biography && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Biography</h2>
                <p className="text-gray-700 dark:text-gray-300">{player.biography}</p>
              </div>
            )}
            
            {player.height && player.weight && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                  <p className="text-xl font-bold">{player.height} cm</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                  <p className="text-xl font-bold">{player.weight} kg</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Career Statistics</h2>
          {renderStats()}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;