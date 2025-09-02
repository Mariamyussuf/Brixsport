'use client';

import React, { useEffect } from 'react';
import Homescreen from '@/components/FootballScreen/Homescreen';
import { useAuth } from '@/hooks/useAuth';
import { hasCompletedOnboarding } from '@/utils/onboarding';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated but hasn't completed onboarding, redirect to onboarding
    if (isAuthenticated && !hasCompletedOnboarding()) {
      router.push('/onboarding');
    }
  }, [isAuthenticated, router]);

  return <Homescreen />;
}