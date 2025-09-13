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
  onDemoAccount?: () => void;
}

export const FavoritesAuthDialog: React.FC<FavoritesAuthDialogProps> = ({ isOpen, onClose, onDemoAccount }) => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth/login?next=/profile');
    onClose();
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
    onClose();
  };

  const handleDemoAccount = () => {
    if (onDemoAccount) {
      onDemoAccount();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Favorites Access</DialogTitle>
          <DialogDescription>
            You need to sign in to use Favorites. Sign in or create an account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onDemoAccount && (
            <Button variant="outline" onClick={handleDemoAccount}>
              Demo Account
            </Button>
          )}
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