'use client';

import React from 'react';
import { Calendar, Heart, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav: React.FC = () => {
  const pathname = usePathname();
  
  const navItems = [
    { 
      name: 'Fixtures', 
      icon: <Calendar className="h-5 w-5" />, 
      path: '/' 
    },
    { 
      name: 'Favourites', 
      icon: <Heart className="h-5 w-5" />, 
      path: '/favorites' 
    },
    { 
      name: 'Competition', 
      icon: <Trophy className="h-5 w-5" />, 
      path: '/competition' 
    },
    { 
      name: 'Profile', 
      icon: <User className="h-5 w-5" />, 
      path: '/profile' 
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glassmorphic-nav">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center space-y-1 px-3 py-1 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400 glow-blue scale-105' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={isActive ? 'scale-110' : ''}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;