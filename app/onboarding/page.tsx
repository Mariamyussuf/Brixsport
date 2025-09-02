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
    <div className="relative min-h-screen w-full flex flex-col justify-start items-center text-white overflow-hidden" style={{ background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(/onboarding-bg-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* BrixSports Logo */}
      <div className="absolute top-8 sm:top-12 md:top-16 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-1">
          <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">BrixSports</span>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 sm:w-12 sm:h-12 md:w-14 md:h-14">
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