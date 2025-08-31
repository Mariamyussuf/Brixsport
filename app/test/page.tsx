'use client';
import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from '@/components/shared/ThemeProvider';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

// Test component to verify dark mode is working
const ThemeTestComponent = () => {
  const { theme, resolvedTheme } = useTheme();
  
  return (
    <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Theme Test</h2>
      <p className="mb-2">Current theme: {theme}</p>
      <p className="mb-2">Resolved theme: {resolvedTheme}</p>
      <p className="mb-2">This text should change color in dark mode.</p>
      <div className="w-32 h-32 bg-red-500 dark:bg-blue-500 rounded-lg"></div>
      <p className="mt-2">The square above should be red in light mode and blue in dark mode.</p>
    </div>
  );
};

// Test component to manually toggle classes
const ManualToggleTest = () => {
  const [manualDark, setManualDark] = useState(false);
  
  useEffect(() => {
    const checkClasses = () => {
      console.log('HTML classes:', document.documentElement.classList.toString());
    };
    
    checkClasses();
    const observer = new MutationObserver(checkClasses);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  const toggleManualDark = () => {
    if (manualDark) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    setManualDark(!manualDark);
  };
  
  return (
    <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Manual Toggle Test</h2>
      <p className="mb-2">Manual dark mode: {manualDark ? 'ON' : 'OFF'}</p>
      <button 
        onClick={toggleManualDark}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
      >
        Toggle Manual Dark
      </button>
      <div className="mt-4 p-2 bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded">
        <p>This box should change colors when you toggle manually.</p>
      </div>
    </div>
  );
};

export default function TestPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-black text-neutral-900 dark:text-neutral-100 p-4">
        <h1 className="text-2xl font-bold mb-4">Dark Mode Test Page</h1>
        <div className="mb-4">
          <ThemeToggle />
        </div>
        <ThemeTestComponent />
        <ManualToggleTest />
      </div>
    </ThemeProvider>
  );
}