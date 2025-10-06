'use client';

import React from 'react';
import TrackEventForm from '@/components/logger/forms/TrackEventForm';

export default function TestTrackEventPage() {
  const handleEventCreated = (event: any) => {
    console.log('Track event created:', event);
    alert('Track event created successfully!');
  };

  const handleCancel = () => {
    console.log('Track event creation cancelled');
    alert('Track event creation cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Test Track Event Creation</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          This page tests the track event creation form.
        </p>
        <TrackEventForm onEventCreated={handleEventCreated} onCancel={handleCancel} />
      </div>
    </div>
  );
}