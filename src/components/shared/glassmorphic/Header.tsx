'use client';

import React from 'react';
import { Search, Bell, Radio } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  variant?: 'auth' | 'main';
}

const Header: React.FC<HeaderProps> = ({ variant = 'main' }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphic-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {variant === 'auth' ? (
            // Auth variant - centered title
            <div className="flex-1 flex justify-center">
              <h1 className="text-xl font-bold text-navy-900 dark:text-white">
                BrixSports
              </h1>
            </div>
          ) : (
            // Main variant - left title, right icons
            <>
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-navy-900 dark:text-white">
                  BrixSports
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5 text-navy-900 dark:text-white" />
                </button>
                
                <button 
                  className="p-2 rounded-full hover:bg-white/20 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-navy-900 dark:text-white" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded-full">
                  <Radio className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">LIVE</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;