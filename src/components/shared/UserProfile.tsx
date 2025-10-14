'use client';
import React, { useState, useRef } from 'react';
import { User, Camera, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  playerImage?: string;
  playerName: string;
  email?: string;
  onImageChange?: (file: File) => Promise<void>;
  onSave?: (data: { name: string; email: string }) => Promise<void>;
  onLogout?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  playerImage = '',
  playerName,
  email = '',
  onImageChange,
  onSave,
  onLogout
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image if handler provided
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
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
        <div className="flex space-x-2">
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
        <div className="relative group">
          <Avatar className="h-16 w-16">
            {imagePreview || playerImage ? (
              <AvatarImage src={imagePreview || playerImage} alt={playerName} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
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
            className="absolute -right-1 -bottom-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg"
          >
            <Camera className="h-3 w-3" />
          </button>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{playerName}</h4>
          {email && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
