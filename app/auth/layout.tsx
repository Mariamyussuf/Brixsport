import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-end items-center text-white bg-black">
      {/* SVG Logo */}
      <div className="absolute top-10 left-0 right-0 flex justify-center">
        <svg width="180" height="48" viewBox="0 0 180 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BrixSports logo">
          <text x="0" y="36" fontFamily="'Montserrat',sans-serif" fontWeight="bold" fontSize="36" fill="white">BrixSports</text>
          <circle cx="160" cy="24" r="16" stroke="white" strokeWidth="3" fill="none" />
          <path d="M160 8v32M144 24h32M150 14l20 20M170 14l-20 20" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-24 min-h-screen justify-end">
        {children}
      </div>
    </div>
  );
}