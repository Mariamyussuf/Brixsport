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
import { Button } from '@/components/ui/button';

interface FavoritesAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoritesAuthDialog: React.FC<FavoritesAuthDialogProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth/login?next=/favorites');
    onClose();
  };

  const handleSignUp = () => {
    router.push('/auth/signup?next=/favorites');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Favorites Access</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            You need to sign in to use Favorites. Sign in or create an account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSignUp}>
            Sign Up
          </Button>
          <Button onClick={handleSignIn}>
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};