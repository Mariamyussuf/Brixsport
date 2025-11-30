'use client';

import React from 'react';
import { OnboardingScreen } from '@/components/FootballScreen/OnboardingScreen';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleFinish = () => {
    // Redirect to home page after onboarding is completed
    router.push('/');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start items-center text-white overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Content */}
      <div className="w-full max-w-6xl mx-auto flex justify-center h-full">
        <OnboardingScreen
          onFinish={handleFinish}
          userName={user?.name}
        />
      </div>
    </div>
  );
}
