import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BrixSportsService from '@/services/BrixSportsService';
import { UpdateScorePayload, Match as BrixMatch } from '@/types/brixsports';

interface ScoreUpdateFormProps {
  matchId: number;
  initialData: {
    home_score: number;
    away_score: number;
    current_minute: number;
    period: string;
    status: string;
  };
  onScoreUpdate: (updatedMatch: BrixMatch) => void;
}

export const ScoreUpdateForm: React.FC<ScoreUpdateFormProps> = ({ 
  matchId, 
  initialData,
  onScoreUpdate 
}) => {
  const [formData, setFormData] = useState<UpdateScorePayload>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('score') || name === 'current_minute' ? parseInt(value) || 0 : value
    }));
  };

  const validateForm = (): boolean => {
    if (formData.home_score < 0 || formData.away_score < 0) {
      setError('Scores cannot be negative');
      return false;
    }
    
    if (formData.current_minute < 0) {
      setError('Current minute cannot be negative');
      return false;
    }
    
    if (!formData.period.trim()) {
      setError('Period is required');
      return false;
    }
    
    if (!formData.status.trim()) {
      setError('Status is required');
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
      const response = await BrixSportsService.updateLiveMatchScore(matchId, formData);
      
      if (response.success && response.data) {
        onScoreUpdate(response.data);
        // Show success message
        alert('Match score updated successfully');
      } else {
        setError(response.error?.message || 'Failed to update match score');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">Update Match Score</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Home Score</label>
            <input
              type="number"
              name="home_score"
              value={formData.home_score}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Away Score</label>
            <input
              type="number"
              name="away_score"
              value={formData.away_score}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Minute</label>
            <input
              type="number"
              name="current_minute"
              value={formData.current_minute}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select period</option>
              <option value="1st Half">1st Half</option>
              <option value="2nd Half">2nd Half</option>
              <option value="Half Time">Half Time</option>
              <option value="Extra Time">Extra Time</option>
              <option value="Penalty Shootout">Penalty Shootout</option>
              <option value="Full Time">Full Time</option>
            </select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="half-time">Half Time</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Score'}
          </Button>
        </div>
      </form>
    </div>
  );
};