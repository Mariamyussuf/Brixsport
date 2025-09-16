import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BrixSportsService from '@/services/BrixSportsService';
import { LiveEventPayload, LiveEvent } from '@/types/brixsports';

interface LiveEventFormProps {
  matchId: number;
  teams: any[];
  onEventAdded: (event: LiveEvent) => void;
  onCancel: () => void;
}

export const LiveEventForm: React.FC<LiveEventFormProps> = ({ 
  matchId, 
  teams,
  onEventAdded,
  onCancel
}) => {
  const [formData, setFormData] = useState<LiveEventPayload>({
    match_id: matchId,
    player_id: 0,
    event_type: '',
    minute: 0,
    description: ''
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value;
    setSelectedTeamId(teamId);
    // Reset player selection when team changes
    setFormData(prev => ({
      ...prev,
      player_id: 0
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minute' || name === 'player_id' || name === 'match_id' ? parseInt(value) || 0 : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.event_type.trim()) {
      setError('Event type is required');
      return false;
    }
    
    if (formData.minute < 0) {
      setError('Minute cannot be negative');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await BrixSportsService.addLiveEvent(formData);
      
      if (response.success && response.data) {
        onEventAdded(response.data);
        // Show success message
        alert('Event added successfully');
      } else {
        setError(response.error?.message || 'Failed to add event');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get players for the selected team
  const getPlayersForTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.players : [];
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">Add Live Event</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Type</label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select event type</option>
              <option value="goal">Goal</option>
              <option value="own_goal">Own Goal</option>
              <option value="assist">Assist</option>
              <option value="yellow_card">Yellow Card</option>
              <option value="red_card">Red Card</option>
              <option value="substitution">Substitution</option>
              <option value="injury">Injury</option>
              <option value="penalty">Penalty</option>
              <option value="corner">Corner</option>
              <option value="foul">Foul</option>
              <option value="offside">Offside</option>
              <option value="save">Save</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Minute</label>
            <input
              type="number"
              name="minute"
              value={formData.minute}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Team (Optional)</label>
            <select
              value={selectedTeamId}
              onChange={handleTeamChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select team (optional)</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedTeamId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Player (Optional)</label>
              <select
                name="player_id"
                value={formData.player_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Select player (optional)</option>
                {getPlayersForTeam(selectedTeamId).map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.name} (#{player.jerseyNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional details about the event"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};