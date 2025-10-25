import React, { useState, useEffect } from 'react';
import { useLogger } from '@/contexts/LoggerContext';
import { LoggerCompetition } from '@/lib/loggerService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { loggerService } from '@/lib/loggerService';
import { ErrorHandler } from '@/lib/errorHandler';

interface CompetitionForm {
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
}

const CompetitionManagement = () => {
  const { competitions, loading, error, loadCompetitions } = useLogger();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<LoggerCompetition | null>(null);
  const [formData, setFormData] = useState<CompetitionForm>({
    name: '',
    sport: 'football',
    startDate: '',
    endDate: '',
    location: '',
    status: 'upcoming'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load competitions on component mount
  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);
    
    try {
      if (editingCompetition) {
        // Update existing competition
        const updateData = {
          name: formData.name,
          sport: formData.sport,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: formData.location,
          status: formData.status
        };
        
        const response = await loggerService.updateCompetition(editingCompetition.id, updateData);
        if (!response.success) {
          throw new Error(response.error || 'Failed to update competition');
        }
      } else {
        // Create new competition
        const competitionData = {
          name: formData.name,
          sport: formData.sport,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: formData.location,
          status: formData.status,
          assignedLoggers: []
        };
        
        const response = await loggerService.createCompetition(competitionData);
        if (!response.success) {
          throw new Error(response.error || 'Failed to create competition');
        }
      }
      
      // Reset form and close dialog
      setFormData({
        name: '',
        sport: 'football',
        startDate: '',
        endDate: '',
        location: '',
        status: 'upcoming'
      });
      setEditingCompetition(null);
      setIsDialogOpen(false);
      
      // Reload competitions
      loadCompetitions();
    } catch (err) {
      const handledError = ErrorHandler.handle(err);
      setLocalError(handledError.message);
      console.error('Failed to save competition:', handledError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit competition
  const handleEdit = (competition: LoggerCompetition) => {
    setEditingCompetition(competition);
    setFormData({
      name: competition.name,
      sport: competition.sport,
      startDate: competition.startDate,
      endDate: competition.endDate,
      location: competition.location || '',
      status: competition.status
    });
    setIsDialogOpen(true);
  };

  // Handle delete competition
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      try {
        const response = await loggerService.deleteCompetition(id);
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete competition');
        }
        
        // Reload competitions
        loadCompetitions();
      } catch (err) {
        const handledError = ErrorHandler.handle(err);
        setLocalError(handledError.message);
        console.error('Failed to delete competition:', handledError);
      }
    }
  };

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCompetition(null);
    setFormData({
      name: '',
      sport: 'football',
      startDate: '',
      endDate: '',
      location: '',
      status: 'upcoming'
    });
    setLocalError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Competition Management</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Competition
        </Button>
      </div>
      
      {(error || localError) && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
          <div className="flex justify-between items-center">
            <span>{error || localError}</span>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Competition
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sport
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Dates
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {competitions.map((competition) => (
              <tr key={competition.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {competition.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300 capitalize">
                    {competition.sport.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(competition.startDate).toLocaleDateString()} - {new Date(competition.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    {competition.location || 'Not specified'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    competition.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : competition.status === 'upcoming'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(competition)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      disabled={isSubmitting}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(competition.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading.competitions && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}
      
      {!loading.competitions && competitions.length === 0 && (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No competitions</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new competition.
          </p>
        </div>
      )}
      
      {/* Competition Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCompetition ? 'Edit Competition' : 'Create Competition'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {localError && (
              <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
                {localError}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Competition Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Inter-Hall Games 2025"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="sport" className="text-sm font-medium">
                Sport
              </label>
              <select
                id="sport"
                name="sport"
                value={formData.sport}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
                <option value="volleyball">Volleyball</option>
                <option value="track_events">Track & Field</option>
                <option value="table_tennis">Table Tennis</option>
                <option value="badminton">Badminton</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Stadium"
                  className="w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {editingCompetition ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingCompetition ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompetitionManagement;