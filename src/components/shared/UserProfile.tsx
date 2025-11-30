'use client';
import React, { useState, useRef } from 'react';
import { Camera, Settings, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  playerImage?: string;
  playerName: string;
  email?: string;
  role?: string;
  onImageChange?: (file: File) => Promise<void>;
  onSave?: (data: { name: string; email: string }) => Promise<void>;
}

const UserProfile: React.FC<UserProfileProps> = ({
  playerImage = '',
  playerName,
  email = '',
  role = 'user',
  onImageChange,
  onSave
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (onImageChange) {
      try {
        await onImageChange(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Profile
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm rounded-full transition-all"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
      </div>

      {/* Profile Content */}
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-500/30 dark:group-hover:bg-blue-400/30 transition-all"></div>
          <Avatar className="h-28 w-28 relative ring-4 ring-white/50 dark:ring-gray-800/50 shadow-xl">
            {imagePreview || playerImage ? (
              <AvatarImage src={imagePreview || playerImage} alt={playerName} />
            ) : (
              <AvatarFallback className="bg-blue-600/90 backdrop-blur-sm text-white text-3xl font-semibold">
                {getInitials(playerName)}
              </AvatarFallback>
            )}
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={handleEditClick}
            className="absolute bottom-1 right-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 p-2.5 rounded-full shadow-lg border border-white/30 dark:border-gray-700/30 transition-all hover:scale-110"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-2">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
            {playerName}
          </h4>

          {/* Role Badge */}
          {role && (
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-sm border border-blue-500/20 dark:border-blue-400/20">
              <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize">
                {role}
              </span>
            </div>
          )}
        </div>

        {/* Email Section */}
        {email && (
          <div className="w-full mt-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
            <div className="flex items-center justify-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;