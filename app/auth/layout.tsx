import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-24 min-h-screen justify-end max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}