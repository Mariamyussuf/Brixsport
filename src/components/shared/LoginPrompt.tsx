'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            To save your favorite teams, players, and competitions, you need to be logged in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleLogin}>
            Log In / Sign Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};