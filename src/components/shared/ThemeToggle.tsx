"use client";
import React from 'react';
import { useTheme } from '@/components/shared/ThemeProvider';

const OPTIONS: Array<{ key: 'light' | 'dark' | 'system'; label: string; icon: string }> = [
  { key: 'light', label: 'Light', icon: '🌞' },
  { key: 'dark', label: 'Dark', icon: '🌚' },
  { key: 'system', label: 'System', icon: '🖥️' },
];

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme, toggle } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 bg-white/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl p-1">
      {OPTIONS.map((opt) => {
        const selected = theme === opt.key || (opt.key !== 'system' && theme === 'system' && resolvedTheme === opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            className={`px-3 py-1 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${selected ? 'bg-blue-600 text-white' : 'text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
            aria-pressed={selected}
            aria-label={`Switch to ${opt.label} theme`}
            onClick={() => setTheme(opt.key)}
          >
            <span aria-hidden>{opt.icon}</span>
          </button>
        );
      })}
      <div className="mx-1 w-px h-5 bg-black/10 dark:bg-white/10" aria-hidden />
      <button
        type="button"
        className="px-3 py-1 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
        onClick={toggle}
        aria-label="Toggle light/dark"
        title="Toggle light/dark"
      >
        ⇄
      </button>
    </div>
  );
};