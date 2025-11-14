'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSwitcherProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

const DateSwitcher: React.FC<DateSwitcherProps> = ({ 
  selectedDate, 
  onDateChange, 
  className = '' 
}) => {
  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Normalize dates for comparison (remove time component)
    const normalizeDate = (d: Date) => d.toISOString().split('T')[0];
    
    const selectedDateStr = normalizeDate(date);
    const todayStr = normalizeDate(today);
    const yesterdayStr = normalizeDate(yesterday);
    const tomorrowStr = normalizeDate(tomorrow);

    if (selectedDateStr === todayStr) {
      return 'Today';
    } else if (selectedDateStr === yesterdayStr) {
      return 'Yesterday';
    } else if (selectedDateStr === tomorrowStr) {
      return 'Tomorrow';
    } else {
      // Format as "14 Nov" for other dates
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={handlePreviousDay}
        className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95 touch-manipulation"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      
      <div className="px-4 py-2 min-w-[120px] text-center">
        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {formatDateDisplay(selectedDate)}
        </span>
      </div>
      
      <button
        onClick={handleNextDay}
        className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95 touch-manipulation"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
};

export default DateSwitcher;