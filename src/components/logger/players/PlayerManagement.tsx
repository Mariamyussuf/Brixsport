import React, { useState, useEffect } from 'react';
import { Player, Team } from '@/types/campus';
import { PlayerSelector } from './PlayerSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Award, 
  TrendingUp 
} from 'lucide-react';

interface PlayerStats {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  fouls: number;
  minutesPlayed: number;
  // Basketball stats
  points: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  // Volleyball stats
  spikes: number;
  aces: number;
  digs: number;
  // Track and field stats
  races: number;
  personalBests: number;
}

interface PlayerManagementProps {
  team: Team;
  onPlayerUpdate: (updatedPlayers: Player[]) => void;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({ team, onPlayerUpdate }) => {
  const [players, setPlayers] = useState<Player[]>(team.players || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState<Omit<Player, 'id'>>({
    name: '',
    number: '',
    teamId: team.id,
    position: '',
    college: '',
    department: '',
    team: team.name,
    teamColor: team.color,
    injured: false,
    suspended: false,
    captain: false
  });
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize with sample stats
  useEffect(() => {
    const sampleStats: PlayerStats[] = players.map(player => ({
      playerId: player.id,
      playerName: player.name,
      goals: Math.floor(Math.random() * 10),
      assists: Math.floor(Math.random() * 15),
      yellowCards: Math.floor(Math.random() * 5),
      redCards: Math.floor(Math.random() * 2),
      saves: Math.floor(Math.random() * 20),
      fouls: Math.floor(Math.random() * 10),
      minutesPlayed: Math.floor(Math.random() * 2000),
      points: Math.floor(Math.random() * 50),
      rebounds: Math.floor(Math.random() * 30),
      steals: Math.floor(Math.random() * 15),
      blocks: Math.floor(Math.random() * 10),
      turnovers: Math.floor(Math.random() * 12),
      spikes: Math.floor(Math.random() * 25),
      aces: Math.floor(Math.random() * 8),
      digs: Math.floor(Math.random() * 30),
      races: Math.floor(Math.random() * 5),
      personalBests: Math.floor(Math.random() * 3)
    }));
    setStats(sampleStats);
  }, [players]);

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.number && player.number.toString().includes(searchTerm)) ||
    (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (player.college && player.college.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) return;
    
    const player: Player = {
      ...newPlayer,
      id: `player-${Date.now()}` // Simple ID generation
    };
    
    const updatedPlayers = [...players, player];
    setPlayers(updatedPlayers);
    onPlayerUpdate(updatedPlayers);
    
    // Reset form
    setNewPlayer({
      name: '',
      number: '',
      teamId: team.id,
      position: '',
      college: '',
      department: '',
      team: team.name,
      teamColor: team.color,
      injured: false,
      suspended: false,
      captain: false
    });
    
    setIsDialogOpen(false);
  };

  const handleUpdatePlayer = () => {
    if (!editingPlayer || !editingPlayer.name.trim()) return;
    
    const updatedPlayers = players.map(player => 
      player.id === editingPlayer.id ? editingPlayer : player
    );
    
    setPlayers(updatedPlayers);
    onPlayerUpdate(updatedPlayers);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      const updatedPlayers = players.filter(player => player.id !== playerId);
      setPlayers(updatedPlayers);
      onPlayerUpdate(updatedPlayers);
    }
  };

  const getPlayerStats = (playerId: string) => {
    return stats.find(stat => stat.playerId === playerId) || null;
  };

  const getTopPerformers = () => {
    return stats
      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search players by name, number, position, or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPlayer(null);
              setIsDialogOpen(true);
            }}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlayer ? 'Edit Player' : 'Add New Player'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editingPlayer ? editingPlayer.name : newPlayer.name}
                  onChange={(e) => 
                    editingPlayer 
                      ? setEditingPlayer({...editingPlayer, name: e.target.value})
                      : setNewPlayer({...newPlayer, name: e.target.value})
                  }
                  placeholder="Player full name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Number</Label>
                  <Input
                    id="number"
                    type="number"
                    value={editingPlayer ? editingPlayer.number || '' : newPlayer.number || ''}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, number: e.target.value})
                        : setNewPlayer({...newPlayer, number: e.target.value})
                    }
                    placeholder="Jersey number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editingPlayer ? editingPlayer.position || '' : newPlayer.position || ''}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, position: e.target.value})
                        : setNewPlayer({...newPlayer, position: e.target.value})
                    }
                    placeholder="Position"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="college">College</Label>
                  <Input
                    id="college"
                    value={editingPlayer ? editingPlayer.college || '' : newPlayer.college || ''}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, college: e.target.value})
                        : setNewPlayer({...newPlayer, college: e.target.value})
                    }
                    placeholder="College name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={editingPlayer ? editingPlayer.department || '' : newPlayer.department || ''}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, department: e.target.value})
                        : setNewPlayer({...newPlayer, department: e.target.value})
                    }
                    placeholder="Department"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="injured"
                    type="checkbox"
                    checked={editingPlayer ? editingPlayer.injured || false : newPlayer.injured || false}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, injured: e.target.checked})
                        : setNewPlayer({...newPlayer, injured: e.target.checked})
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="injured">Injured</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="suspended"
                    type="checkbox"
                    checked={editingPlayer ? editingPlayer.suspended || false : newPlayer.suspended || false}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, suspended: e.target.checked})
                        : setNewPlayer({...newPlayer, suspended: e.target.checked})
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="suspended">Suspended</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="captain"
                    type="checkbox"
                    checked={editingPlayer ? editingPlayer.captain || false : newPlayer.captain || false}
                    onChange={(e) => 
                      editingPlayer 
                        ? setEditingPlayer({...editingPlayer, captain: e.target.checked})
                        : setNewPlayer({...newPlayer, captain: e.target.checked})
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="captain">Captain</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={editingPlayer ? handleUpdatePlayer : handleAddPlayer}
                  disabled={!(editingPlayer ? editingPlayer.name : newPlayer.name).trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingPlayer ? 'Update' : 'Add'} Player
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getTopPerformers().map((playerStat, index) => {
              const player = players.find(p => p.id === playerStat.playerId);
              return player ? (
                <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                    <p className="text-sm text-gray-500">
                      {playerStat.goals} goals, {playerStat.assists} assists
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {playerStat.goals + playerStat.assists} pts
                  </Badge>
                </div>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Team Roster ({filteredPlayers.length} players)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player) => {
                  const playerStats = getPlayerStats(player.id);
                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: player.teamColor || '#2563eb' }}
                          >
                            {player.number || player.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            {player.captain && (
                              <Badge variant="default" className="mt-1">
                                <Award className="w-3 h-3 mr-1" />
                                Captain
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>#{player.number}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>{player.college}</TableCell>
                      <TableCell>
                        {player.injured ? (
                          <Badge variant="destructive">Injured</Badge>
                        ) : player.suspended ? (
                          <Badge variant="outline">Suspended</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {playerStats && (
                          <div className="text-sm">
                            <div>G: {playerStats.goals} A: {playerStats.assists}</div>
                            <div>YC: {playerStats.yellowCards} RC: {playerStats.redCards}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingPlayer(player);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No players found</p>
              <p className="text-sm">Add players to your team roster</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Team Stats Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.reduce((sum, stat) => sum + stat.goals, 0)}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.reduce((sum, stat) => sum + stat.assists, 0)}</div>
              <div className="text-sm text-gray-600">Total Assists</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.reduce((sum, stat) => sum + stat.yellowCards, 0)}</div>
              <div className="text-sm text-gray-600">Yellow Cards</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold">{stats.reduce((sum, stat) => sum + stat.redCards, 0)}</div>
              <div className="text-sm text-gray-600">Red Cards</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};