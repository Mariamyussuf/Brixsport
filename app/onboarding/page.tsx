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
      {/* BrixSports Logo */}
      <div className="absolute top-4 sm:top-6 md:top-8 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-1">
          <span className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">BrixSports</span>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 sm:w-10 sm:h-10 md:w-12 md:h-12">
            <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" fill="none" />
            <path d="M16 1v30M1 16h30M6 6l20 20M26 6L6 26" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      
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
