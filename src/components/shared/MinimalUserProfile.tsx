'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MinimalUserProfileProps {
  playerImage?: string;
  playerName: string;
  email?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}

const MinimalUserProfile: React.FC<MinimalUserProfileProps> = ({
  playerImage = '',
  playerName,
  email = '',
  onLogout,
  onSettings
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <div className="flex space-x-2">
          {onSettings && (
            <Button
              variant="outline"
              size="icon"
              onClick={onSettings}
              className="border-gray-200 dark:border-gray-700"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
          {onLogout && (
            <Button
              variant="outline"
              size="icon"
              onClick={onLogout}
              className="border-gray-200 dark:border-gray-700"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          {playerImage ? (
            <AvatarImage src={playerImage} alt={playerName} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
              {getInitials(playerName)}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{playerName}</h3>
          {email && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalUserProfile;