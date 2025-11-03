import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start items-center text-neutral-900 dark:text-neutral-100 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* BrixSports Logo */}
      <div className="absolute top-4 sm:top-6 md:top-8 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-1">
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">BrixSports</span>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 sm:w-8 sm:h-8 md:w-10 md:h-10">
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 1v30M1 16h30M6 6l20 20M26 6L6 26" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-16 md:pt-20 min-h-screen justify-end max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}