import React, { useState, useEffect } from 'react';
import { Team, Player } from '@/types/matchEvents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, User, Users } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { LoadingState } from '@/components/shared/LoadingState';
import { CreateTeamPayload } from '@/types/brixsports';

interface TeamForm {
  name: string;
  coachName: string;
  logoUrl: string;
  foundedYear?: number;
  stadium?: string;
  city?: string;
  country?: string;
  colorPrimary?: string;
  colorSecondary?: string;
}

interface PlayerForm {
  name: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  status: 'on-field' | 'substituted' | 'injured';
}

const TeamManagement = () => {
  const { getTeams, createTeam } = useApi();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState<TeamForm>({
    name: '',
    coachName: '',
    logoUrl: '',
    foundedYear: undefined,
    stadium: '',
    city: '',
    country: '',
    colorPrimary: '',
    colorSecondary: ''
  });

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await getTeams();
        if (response.success && response.data) {
          setTeams(response.data);
          setError(null);
        } else {
          setError(response.error || 'Failed to fetch teams');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [getTeams]);

  const [playerFormData, setPlayerFormData] = useState<PlayerForm>({
    name: '',
    jerseyNumber: 1,
    position: 'MID',
    status: 'on-field'
  });

  // Handle team form input changes
  const handleTeamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle team form number input changes
  const handleTeamNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
  };

  // Handle player form input changes
  const handlePlayerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlayerFormData(prev => ({ 
      ...prev, 
      [name]: name === 'jerseyNumber' ? parseInt(value) || 1 : value 
    }));
  };

  // Handle player select changes
  const handlePlayerSelectChange = (name: keyof PlayerForm, value: string) => {
    setPlayerFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle team form submission
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!teamFormData.name.trim() || !teamFormData.logoUrl.trim()) {
      setError('Team name and logo URL are required');
      return;
    }

    // Create payload for API call
    const payload: CreateTeamPayload = {
      name: teamFormData.name,
      logo_url: teamFormData.logoUrl,
      founded_year: teamFormData.foundedYear,
      stadium: teamFormData.stadium,
      city: teamFormData.city,
      country: teamFormData.country,
      color_primary: teamFormData.colorPrimary,
      color_secondary: teamFormData.colorSecondary
    };

    try {
      const response = await createTeam(payload);
      
      if (response.success && response.data) {
        // Add the new team to the list
        const newTeam: Team = {
          id: response.data.id.toString(), // Convert number to string for matchEvents Team interface
          name: response.data.name,
          logoUrl: response.data.logo_url,
          coachName: teamFormData.coachName,
          players: []
        };
        
        setTeams(prev => [...prev, newTeam]);
        
        // Reset form and close dialog
        setTeamFormData({
          name: '',
          coachName: '',
          logoUrl: '',
          foundedYear: undefined,
          stadium: '',
          city: '',
          country: '',
          colorPrimary: '',
          colorSecondary: ''
        });
        setEditingTeam(null);
        setIsTeamDialogOpen(false);
        setError(null);
      } else {
        setError(response.error?.message || 'Failed to create team');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  // Handle player form submission
  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam) return;
    
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      teamId: selectedTeam.id,
      name: playerFormData.name,
      jerseyNumber: playerFormData.jerseyNumber,
      position: playerFormData.position,
      status: playerFormData.status
    };
    
    const updatedTeams = teams.map(team => {
      if (team.id === selectedTeam.id) {
        return {
          ...team,
          players: [...team.players, newPlayer]
        };
      }
      return team;
    });
    
    setTeams(updatedTeams);
    setSelectedTeam(updatedTeams.find(t => t.id === selectedTeam.id) || null);
    
    // Reset form and close dialog
    setPlayerFormData({
      name: '',
      jerseyNumber: 1,
      position: 'MID',
      status: 'on-field'
    });
    setIsPlayerDialogOpen(false);
  };

  // Handle edit team
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      coachName: team.coachName || '',
      logoUrl: team.logoUrl || '',
      foundedYear: undefined,
      stadium: '',
      city: '',
      country: '',
      colorPrimary: '',
      colorSecondary: ''
    });
    setIsTeamDialogOpen(true);
  };

  // Handle delete team
  const handleDeleteTeam = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      setTeams(prev => prev.filter(team => team.id !== id));
      if (selectedTeam?.id === id) {
        setSelectedTeam(null);
      }
    }
  };

  // Handle edit player
  const handleEditPlayer = (player: Player) => {
    setPlayerFormData({
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      status: player.status
    });
    setIsPlayerDialogOpen(true);
  };

  // Handle delete player
  const handleDeletePlayer = (teamId: string, playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      const updatedTeams = teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.filter(player => player.id !== playerId)
          };
        }
        return team;
      });
      
      setTeams(updatedTeams);
      setSelectedTeam(updatedTeams.find(t => t.id === teamId) || null);
    }
  };

  // Reset team form when dialog closes
  const handleTeamDialogClose = () => {
    setIsTeamDialogOpen(false);
    setEditingTeam(null);
    setTeamFormData({
      name: '',
      coachName: '',
      logoUrl: '',
      foundedYear: undefined,
      stadium: '',
      city: '',
      country: '',
      colorPrimary: '',
      colorSecondary: ''
    });
  };

  // Reset player form when dialog closes
  const handlePlayerDialogClose = () => {
    setIsPlayerDialogOpen(false);
    setPlayerFormData({
      name: '',
      jerseyNumber: 1,
      position: 'MID',
      status: 'on-field'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <LoadingState isLoading={loading} error={error}>
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Team Management</h2>
            <Dialog open={isTeamDialogOpen} onOpenChange={handleTeamDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsTeamDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTeam ? 'Edit Team' : 'Create Team'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Team Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={teamFormData.name}
                      onChange={handleTeamInputChange}
                      placeholder="e.g., Team A"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="logoUrl" className="text-sm font-medium">
                      Logo URL *
                    </label>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      value={teamFormData.logoUrl}
                      onChange={handleTeamInputChange}
                      placeholder="e.g., https://example.com/logo.png"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="coachName" className="text-sm font-medium">
                      Coach Name
                    </label>
                    <Input
                      id="coachName"
                      name="coachName"
                      value={teamFormData.coachName}
                      onChange={handleTeamInputChange}
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="foundedYear" className="text-sm font-medium">
                      Founded Year
                    </label>
                    <Input
                      id="foundedYear"
                      name="foundedYear"
                      type="number"
                      value={teamFormData.foundedYear || ''}
                      onChange={handleTeamNumberInputChange}
                      placeholder="e.g., 1990"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="stadium" className="text-sm font-medium">
                      Stadium
                    </label>
                    <Input
                      id="stadium"
                      name="stadium"
                      value={teamFormData.stadium}
                      onChange={handleTeamInputChange}
                      placeholder="e.g., National Stadium"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium">
                        City
                      </label>
                      <Input
                        id="city"
                        name="city"
                        value={teamFormData.city}
                        onChange={handleTeamInputChange}
                        placeholder="e.g., New York"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="country" className="text-sm font-medium">
                        Country
                      </label>
                      <Input
                        id="country"
                        name="country"
                        value={teamFormData.country}
                        onChange={handleTeamInputChange}
                        placeholder="e.g., USA"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="colorPrimary" className="text-sm font-medium">
                        Primary Color
                      </label>
                      <Input
                        id="colorPrimary"
                        name="colorPrimary"
                        value={teamFormData.colorPrimary}
                        onChange={handleTeamInputChange}
                        placeholder="e.g., #FF0000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="colorSecondary" className="text-sm font-medium">
                        Secondary Color
                      </label>
                      <Input
                        id="colorSecondary"
                        name="colorSecondary"
                        value={teamFormData.colorSecondary}
                        onChange={handleTeamInputChange}
                        placeholder="e.g., #0000FF"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleTeamDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTeam ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teams List */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Teams</h3>
              <div className="space-y-3">
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id 
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full mr-3" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.coachName || 'No coach assigned'}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTeam(team);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {team.players?.length || 0} players
                    </div>
                  </div>
                ))}
                
                {teams.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2">No teams created yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Players List */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {selectedTeam ? `${selectedTeam.name} Players` : 'Select a team'}
                </h3>
                {selectedTeam && (
                  <Dialog open={isPlayerDialogOpen} onOpenChange={handlePlayerDialogClose}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        onClick={() => setIsPlayerDialogOpen(true)}
                        disabled={!selectedTeam}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Player</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePlayerSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="playerName" className="text-sm font-medium">
                            Player Name
                          </label>
                          <Input
                            id="playerName"
                            name="name"
                            value={playerFormData.name}
                            onChange={handlePlayerInputChange}
                            placeholder="e.g., John Doe"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="jerseyNumber" className="text-sm font-medium">
                            Jersey Number
                          </label>
                          <Input
                            id="jerseyNumber"
                            name="jerseyNumber"
                            type="number"
                            min="1"
                            max="99"
                            value={playerFormData.jerseyNumber}
                            onChange={handlePlayerInputChange}
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="position" className="text-sm font-medium">
                              Position
                            </label>
                            <select
                              id="position"
                              value={playerFormData.position}
                              onChange={(e) => handlePlayerSelectChange('position', e.target.value as any)}
                              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                              <option value="GK">Goalkeeper (GK)</option>
                              <option value="DEF">Defender (DEF)</option>
                              <option value="MID">Midfielder (MID)</option>
                              <option value="FWD">Forward (FWD)</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="status" className="text-sm font-medium">
                              Status
                            </label>
                            <select
                              id="status"
                              value={playerFormData.status}
                              onChange={(e) => handlePlayerSelectChange('status', e.target.value as any)}
                              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                              <option value="on-field">On Field</option>
                              <option value="substituted">Substituted</option>
                              <option value="injured">Injured</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={handlePlayerDialogClose}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Add Player
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {selectedTeam ? (
                <div className="space-y-3">
                  {selectedTeam.players?.map((player) => (
                    <div key={player.id} className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              #{player.jerseyNumber} • {player.position}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            player.status === 'on-field' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : player.status === 'substituted'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {player.status.replace('-', ' ')}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditPlayer(player)}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(selectedTeam.id, player.id)}
                              className="p-1 text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {!selectedTeam.players?.length && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <User className="mx-auto h-12 w-12 opacity-50" />
                      <p className="mt-2">No players added yet</p>
                      <p className="text-sm mt-1">Click "Add Player" to get started</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">Select a team to view and manage players</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </LoadingState>
    </div>
  );
};

export default TeamManagement;