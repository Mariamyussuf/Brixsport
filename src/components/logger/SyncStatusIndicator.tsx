import React, { useState, useEffect } from 'react';
import { campusDesign } from '../../styles/campusDesign';

export interface SyncStatusIndicatorProps {
  status: 'online' | 'offline' | 'syncing' | 'error';
  lastSync?: number;
  errorMessage?: string;
  onRetry?: () => void;
  syncProgress?: number;
  pendingItems?: number;
}

const STATUS_MAP = {
  online: {
    icon: '🟢',
    label: 'Online',
    color: 'bg-green-100 text-green-800',
    hoverColor: 'hover:bg-green-200',
  },
  offline: {
    icon: '🔴',
    label: 'Offline',
    color: 'bg-red-100 text-red-800',
    hoverColor: 'hover:bg-red-200',
  },
  syncing: {
    icon: '🔄',
    label: 'Syncing...',
    color: 'bg-blue-100 text-blue-800',
    hoverColor: 'hover:bg-blue-200',
  },
  error: {
    icon: '❌',
    label: 'Sync Error',
    color: 'bg-red-200 text-red-900',
    hoverColor: 'hover:bg-red-300',
  },
};

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  lastSync,
  errorMessage,
  onRetry,
  syncProgress = 0,
  pendingItems = 0,
}) => {
  const { icon, label, color, hoverColor } = STATUS_MAP[status];
  const [isExpanded, setIsExpanded] = useState(false);
  const [showError, setShowError] = useState(true);

  // Reset error visibility when error message changes
  useEffect(() => {
    if (errorMessage) {
      setShowError(true);
    }
  }, [errorMessage]);

  // Format time difference
  const getTimeSinceLastSync = () => {
    if (!lastSync) return '';
    const diff = Date.now() - lastSync;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const renderProgressBar = () => {
    if (status !== 'syncing' || syncProgress === undefined) return null;
    return (
      <div className="w-full h-1 bg-blue-200 rounded-full mt-2">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${syncProgress}%` }}
        />
      </div>
    );
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        flex flex-col
        ${isExpanded ? 'w-64' : 'w-auto'}
        rounded-xl shadow-lg
        ${color}
        ${status === 'error' ? hoverColor : ''}
        ${campusDesign.animations}
        transform transition-all duration-300 ease-in-out
        ${isExpanded ? 'scale-105' : 'hover:scale-105'}
      `}
      role="status"
      aria-live={status === 'error' ? 'assertive' : 'polite'}
      tabIndex={0}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsExpanded(!isExpanded);
        }
      }}
      title={isExpanded ? 'Click to collapse' : 'Click to expand'}
    >
      <div className="flex items-center gap-2 px-4 py-2 cursor-pointer">
        <span
          className={`text-xl ${status === 'syncing' ? 'animate-spin' : ''}`}
          aria-hidden
        >
          {icon}
        </span>
        <span className="font-semibold text-sm">{label}</span>
        {!isExpanded && status === 'syncing' && pendingItems > 0 && (
          <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">
            {pendingItems} items
          </span>
        )}
      </div>

      <div
        className={`
        overflow-hidden transition-all duration-300
        ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}
      `}
      >
        <div className="px-4 pb-3 space-y-2">
          {status === 'online' && lastSync && (
            <div className="flex items-center justify-between text-xs">
              <span>Last synced:</span>
              <span className="font-medium">{getTimeSinceLastSync()}</span>
            </div>
          )}

          {status === 'syncing' && (
            <>
              {renderProgressBar()}
              {pendingItems > 0 && (
                <div className="text-xs mt-2">
                  Syncing {pendingItems} items...
                </div>
              )}
            </>
          )}

          {status === 'error' && errorMessage && showError && (
            <div className="text-xs bg-red-100 p-2 rounded mt-2 relative">
              <button
                className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowError(false);
                }}
                aria-label="Dismiss error message"
              >
                ✕
              </button>
              {errorMessage}
              {onRetry && (
                <button
                  className="mt-2 text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry();
                  }}
                >
                  Retry sync
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};