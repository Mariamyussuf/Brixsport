import React from 'react';
import { useI18n } from './I18nProvider';

export interface TrackEvent {
  id?: string;
  // Different property names used in different components
  name?: string;  // Used in FixturesScreen
  event?: string; // Used in HomeScreen
  time?: string;
  status: 'live' | 'scheduled' | 'ended' | 'Live' | 'Ended';
  results?: { position: string; team: string }[];
}

interface TrackEventCardProps {
  event: TrackEvent;
}

const TrackEventCard: React.FC<TrackEventCardProps> = ({ event }) => {
  const { t } = useI18n();
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 touch-manipulation">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium text-white w-fit ${
          event.status === 'ended' || event.status === 'Ended' ? 'bg-red-500' : 
          event.status === 'live' || event.status === 'Live' ? 'bg-green-500' : 'bg-gray-500'
        }`}>
          {event.status}
        </span>
        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">{event.event || event.name}</span>
      </div>
      
      <div className="space-y-1.5 sm:space-y-2">
        {event.results && event.results.map((result, index) => (
          <div key={index} className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-gray-600 dark:text-gray-300 font-medium w-8 sm:w-10 text-xs sm:text-sm">{result.position}</span>
            <span className="text-gray-800 dark:text-gray-100 text-xs sm:text-sm">{result.team}</span>
          </div>
        ))}
      </div>
      
      {event.time && (
        <div className="mt-2 text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">{event.time}</div>
      )}
    </div>
  );
};

export default TrackEventCard;