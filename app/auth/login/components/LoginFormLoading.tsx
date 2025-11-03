import React from 'react';

export default function LoginFormLoading() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mx-auto mb-8 animate-pulse"></div>
      
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 animate-pulse"></div>
        </div>
        
        <div className="h-12 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 rounded-lg animate-pulse"></div>
        
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}