import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex text-white overflow-hidden" style={{ background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(/onboarding-bg-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* BrixSports Logo at top left corner */}
      <div className="absolute top-0 left-0 p-4 md:p-6 z-20">
        <div className="flex items-center gap-2">
          <span className="text-white text-2xl md:text-3xl font-bold">BrixSports</span>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-8 md:h-8">
            <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" fill="none" />
            <path d="M16 1v30M1 16h30M6 6l20 20M26 6L6 26" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col justify-center items-center px-6 py-8 mt-16 md:mt-20">
        {children}
      </div>
    </div>
  );
}