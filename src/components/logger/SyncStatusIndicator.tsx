import React from 'react';
import { campusDesign } from '../../styles/campusDesign';

export interface SyncStatusIndicatorProps {
  status: 'online' | 'offline' | 'syncing' | 'error';
  lastSync?: number;
  errorMessage?: string;
}

const STATUS_MAP = {
  online: {
    icon: '🟢',
    label: 'Online',
    color: 'bg-green-100 text-green-800',
  },
  offline: {
    icon: '🔴',
    label: 'Offline',
    color: 'bg-red-100 text-red-800',
  },
  syncing: {
    icon: '🔄',
    label: 'Syncing...',
    color: 'bg-blue-100 text-blue-800 animate-spin',
  },
  error: {
    icon: '❌',
    label: 'Sync Error',
    color: 'bg-red-200 text-red-900',
  },
};

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status, lastSync, errorMessage }) => {
  const { icon, label, color } = STATUS_MAP[status];
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg ${color} ${campusDesign.animations}`}
      role="status"
      aria-live="polite"
      tabIndex={0}
      title={
        status === 'error' && errorMessage
          ? `Sync error: ${errorMessage}`
          : status === 'online' && lastSync
          ? `Last sync: ${new Date(lastSync).toLocaleTimeString()}`
          : label
      }
    >
      <span className="text-xl" aria-hidden>{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
      {status === 'online' && lastSync && (
        <span className="text-xs text-gray-600 ml-2">Last sync: {new Date(lastSync).toLocaleTimeString()}</span>
      )}
      {status === 'error' && errorMessage && (
        <span className="text-xs text-red-900 ml-2">{errorMessage}</span>
      )}
    </div>
  );
}; 