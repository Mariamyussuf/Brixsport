import React from 'react';

interface LoadingStateProps {
  isLoading: boolean;
  error: string | null;
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ isLoading, error, children }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 text-center py-8">
        {error}
      </div>
    );
  }

  return <>{children}</>;
};