'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Team, Player } from '@/types/brixsports';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, MapPin, Calendar } from 'lucide-react';

export default function TeamDetailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('id');
  
  const { getTeamById } = useApi();
  const [teamData, setTeamData] = useState<{ team: Team; players: Player[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setError('No team ID provided');
      setLoading(false);
      return;
    }

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const id = parseInt(teamId, 10);
        if (isNaN(id)) {
          throw new Error('Invalid team ID');
        }
        
        const response = await getTeamById(id);
        
        if (response.success && response.data) {
          setTeamData(response.data);
        } else {
          setError(response.error?.message || 'Team not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, getTeamById]);

  // Group players by position
  const groupPlayersByPosition = (players: Player[]) => {
    const grouped: Record<string, Player[]> = {};
    
    players.forEach(player => {
      // Handle case where position is undefined
      const position = player.position || 'Unknown';
      if (!grouped[position]) {
        grouped[position] = [];
      }
      grouped[position].push(player);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Team Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">The requested team could not be found.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { team, players } = teamData;
  const groupedPlayers = groupPlayersByPosition(players);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Team Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {team.logo_url ? (
                <img 
                  src={team.logo_url} 
                  alt={team.name} 
                  className="w-24 h-24 rounded-lg object-contain"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{team.name}</h1>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  {team.city && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{team.city}</span>
                    </div>
                  )}
                  
                  {team.stadium && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{team.stadium}</span>
                    </div>
                  )}
                  
                  {team.founded_year && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Founded {team.founded_year}</span>
                    </div>
                  )}
                </div>
                
                {(team.color_primary || team.color_secondary) && (
                  <div className="flex gap-2 mt-4">
                    {team.color_primary && (
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 mr-2" 
                          style={{ backgroundColor: team.color_primary }}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Primary</span>
                      </div>
                    )}
                    
                    {team.color_secondary && (
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 mr-2" 
                          style={{ backgroundColor: team.color_secondary }}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Secondary</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Players ({players.length})
            </h2>
          </div>
          
          {players.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No players registered</h3>
              <p className="text-gray-500 dark:text-gray-400">This team doesn't have any players yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(groupedPlayers).map(([position, positionPlayers]) => (
                <div key={position} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{position}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {positionPlayers.map((player) => (
                      <div 
                        key={player.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {player.profilePictureUrl ? (
                            <img 
                              src={player.profilePictureUrl} 
                              alt={player.displayName || `${player.firstName} ${player.lastName}`} 
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {player.displayName || `${player.firstName} ${player.lastName}` || 'Unknown Player'}
                            </h4>
                            <div className="mt-1 space-y-1">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Position: {player.position || 'Unknown'}
                              </p>
                              {player.dateOfBirth && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  DOB: {new Date(player.dateOfBirth).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Nationality: {player.nationality || 'Unknown'}
                              </p>
                              {player.height && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Height: {player.height}cm
                                </p>
                              )}
                              {player.weight && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Weight: {player.weight}kg
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}