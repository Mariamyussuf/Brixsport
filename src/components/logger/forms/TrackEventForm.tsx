import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useCompetitions } from '@/hooks/useCompetitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { Competition } from '@/lib/competitionService';

interface CreateTrackEventPayload {
  competition_id: number;
  event_name: string;
  event_type: string;
  gender: "male" | "female";
  scheduled_time: string;
}

interface TrackEventFormProps {
  onEventCreated: (event: any) => void;
  onCancel: () => void;
}

const TrackEventForm: React.FC<TrackEventFormProps> = ({ onEventCreated, onCancel }) => {
  const { createTrackEvent } = useApi();
  const { competitions, loading: competitionsLoading, error: competitionsError } = useCompetitions();
  
  const [formData, setFormData] = useState({
    competition_id: '',
    event_name: '',
    event_type: '',
    gender: 'male' as "male" | "female",
    scheduled_time: '',
    scheduled_date: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Event type options
  const eventTypes = [
    'sprint',
    'middle_distance',
    'long_distance',
    'hurdles',
    'relay',
    'jump',
    'throw',
    'pole_vault',
    'decathlon',
    'heptathlon'
  ];
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.competition_id) {
      newErrors.competition_id = 'Competition is required';
    }
    
    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }
    
    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }
    
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Date is required';
    }
    
    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      const isoString = scheduledDateTime.toISOString();
      
      const payload: CreateTrackEventPayload = {
        competition_id: parseInt(formData.competition_id, 10),
        event_name: formData.event_name,
        event_type: formData.event_type,
        gender: formData.gender,
        scheduled_time: isoString,
      };
      
      const response = await createTrackEvent(payload);
      
      if (response.success && response.data) {
        onEventCreated(response.data);
        // Reset form
        setFormData({
          competition_id: '',
          event_name: '',
          event_type: '',
          gender: 'male',
          scheduled_time: '',
          scheduled_date: '',
        });
      } else {
        setSubmitError(response.error?.message || 'Failed to create track event');
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Create Track Event</h2>
      
      {submitError && (
        <div className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{submitError}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Competition Selection */}
          <div className="space-y-2">
            <Label htmlFor="competition_id" className="text-gray-700 dark:text-gray-300">
              Competition <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.competition_id}
              onValueChange={(value) => handleChange('competition_id', value)}
              disabled={competitionsLoading}
            >
              <SelectTrigger 
                className={errors.competition_id ? 'border-red-500' : ''}
                aria-invalid={!!errors.competition_id}
              >
                <SelectValue placeholder="Select competition" />
              </SelectTrigger>
              <SelectContent>
                {competitionsLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  competitions.map((competition: Competition) => (
                    <SelectItem key={competition.id} value={competition.id.toString()}>
                      {competition.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.competition_id && (
              <p className="text-red-500 text-sm">{errors.competition_id}</p>
            )}
            {competitionsError && (
              <p className="text-red-500 text-sm">Failed to load competitions: {competitionsError}</p>
            )}
          </div>
          
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event_name" className="text-gray-700 dark:text-gray-300">
              Event Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event_name"
              value={formData.event_name}
              onChange={(e) => handleChange('event_name', e.target.value)}
              placeholder="e.g., 100m, Long Jump"
              className={errors.event_name ? 'border-red-500' : ''}
              aria-invalid={!!errors.event_name}
            />
            {errors.event_name && (
              <p className="text-red-500 text-sm">{errors.event_name}</p>
            )}
          </div>
          
          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event_type" className="text-gray-700 dark:text-gray-300">
              Event Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => handleChange('event_type', value)}
            >
              <SelectTrigger 
                className={errors.event_type ? 'border-red-500' : ''}
                aria-invalid={!!errors.event_type}
              >
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.event_type && (
              <p className="text-red-500 text-sm">{errors.event_type}</p>
            )}
          </div>
          
          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">
              Gender <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={() => handleChange('gender', 'male')}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Male</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={() => handleChange('gender', 'female')}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Female</span>
              </label>
            </div>
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_date" className="text-gray-700 dark:text-gray-300">
              Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleChange('scheduled_date', e.target.value)}
                className={errors.scheduled_date ? 'border-red-500' : ''}
                aria-invalid={!!errors.scheduled_date}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.scheduled_date && (
              <p className="text-red-500 text-sm">{errors.scheduled_date}</p>
            )}
          </div>
          
          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_time" className="text-gray-700 dark:text-gray-300">
              Time <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => handleChange('scheduled_time', e.target.value)}
                className={errors.scheduled_time ? 'border-red-500' : ''}
                aria-invalid={!!errors.scheduled_time}
              />
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.scheduled_time && (
              <p className="text-red-500 text-sm">{errors.scheduled_time}</p>
            )}
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TrackEventForm;