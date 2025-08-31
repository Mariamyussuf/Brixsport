
'use client';

import React, { useState, useRef } from 'react';
import { User, Edit2 } from 'lucide-react';

interface UserProfileProps {
  playerImage: string;
  playerName: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  playerImage,
  playerName,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex-shrink-0">
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Profile Preview"
            className="w-full h-full object-cover"
          />
        ) : playerImage ? (
          <img
            src={playerImage}
            alt={playerName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      <button
        onClick={handleEditClick}
        className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition-transform transform hover:scale-110 active:scale-95"
        aria-label="Edit profile picture"
      >
        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

export default UserProfile;
