'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Users, Play, Square, CheckCircle, XCircle } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrackEvent } from '@/types/brixsports';

const TrackEventDetailScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Handle case where searchParams might be null during SSR
  const eventId = searchParams ? searchParams.get('id') : null;
  
  const { getTrackEventById, updateTrackEventStatus } = useApi();
  const [trackEvent, setTrackEvent] = useState<TrackEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch data if we're server-side rendering
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    const fetchTrackEventData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const id = parseInt(eventId, 10);
        if (isNaN(id)) {
          throw new Error('Invalid event ID');
        }
        
        const response = await getTrackEventById(id);
        if (response.success && response.data) {
          setTrackEvent(response.data);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch track event data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch track event data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackEventData();
  }, [eventId, getTrackEventById]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!trackEvent) return;
    
    setStatusUpdating(true);
    setStatusUpdateError(null);
    
    try {
      const response = await updateTrackEventStatus(trackEvent.id, newStatus);
      
      if (response.success && response.data) {
        setTrackEvent(response.data);
      } else {
        setStatusUpdateError(response.error?.message || 'Failed to update event status');
      }
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'scheduled':
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'scheduled':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Show loading state during SSR or initial client load
  if (typeof window === 'undefined' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading track event data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Error Loading Track Event</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!trackEvent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Track Event Not Found</h2>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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
        {/* Event Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {trackEvent.event_name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="capitalize">{trackEvent.gender}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{new Date(trackEvent.scheduled_time).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{new Date(trackEvent.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <div className="flex items-center mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(trackEvent.status)}`}>
                    {getStatusIcon(trackEvent.status)}
                    <span className="ml-1 capitalize">{trackEvent.status}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Section - Admin/Logger Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Event Status Management
            </h2>
          </div>
          
          <div className="p-6">
            {statusUpdateError && (
              <div className="mb-4 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-200">{statusUpdateError}</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Update Event Status
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current status: <span className="font-medium capitalize">{trackEvent.status}</span>
                </p>
              </div>
              
              <div className="w-full sm:w-auto">
                <Select 
                  value={trackEvent.status} 
                  onValueChange={handleStatusUpdate}
                  disabled={statusUpdating}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {statusUpdating && (
              <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Updating status...
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Event Details
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Event Type</p>
                    <p className="font-medium capitalize">{trackEvent.event_type.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="font-medium capitalize">{trackEvent.gender}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Competition ID</p>
                    <p className="font-medium">{trackEvent.competition_id}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Schedule</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled Date</p>
                    <p className="font-medium">{new Date(trackEvent.scheduled_time).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled Time</p>
                    <p className="font-medium">{new Date(trackEvent.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackEventDetailScreen;