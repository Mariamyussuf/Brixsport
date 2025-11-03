import React from 'react';
import Header from '@/components/shared/glassmorphic/Header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start items-center text-neutral-900 dark:text-neutral-100 overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Header variant="auth" />
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-16 md:pt-20 min-h-screen justify-end max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}