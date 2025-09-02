'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FavoritesAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoAccount: () => void; // Added onDemoAccount callback
}

export const FavoritesAuthDialog: React.FC<FavoritesAuthDialogProps> = ({ isOpen, onClose, onDemoAccount }) => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth/login?next=/profile');
    onClose();
  };

  const handleDemoAccount = () => {
    // Call the onDemoAccount callback
    onDemoAccount();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Favorites Access">
      <p className="mb-6">You need to sign in to use Favorites. Sign in or continue with demo account.</p>
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleDemoAccount}>
          Use Demo Account
        </Button>
        <Button onClick={handleSignIn}>
          Sign In
        </Button>
      </div>
    </Dialog>
  );
};