'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button'; // Assuming a Button component exists

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth');
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Authentication Required">
      <p>To save your favorite teams, players, and competitions, you need to be logged in.</p>
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleLogin}>
          Log In / Sign Up
        </Button>
      </div>
    </Dialog>
  );
};
