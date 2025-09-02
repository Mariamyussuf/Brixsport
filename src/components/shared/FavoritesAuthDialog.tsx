'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface FavoritesAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoAccount: () => void;
}

export const FavoritesAuthDialog: React.FC<FavoritesAuthDialogProps> = ({ isOpen, onClose, onDemoAccount }) => {
  const router = useRouter();
  const { demoLogin } = useAuth();

  const handleSignIn = () => {
    router.push('/auth/login?next=/profile');
    onClose();
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
    onClose();
  };

  const handleDemoAccount = async () => {
    try {
      await demoLogin();
      onDemoAccount();
    } catch (error) {
      console.error('Demo login failed:', error);
    }
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
        <Button variant="outline" onClick={handleSignUp}>
          Sign Up
        </Button>
        <Button onClick={handleSignIn}>
          Sign In
        </Button>
      </div>
    </Dialog>
  );
};