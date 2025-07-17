import React, { useEffect, useState } from 'react';

const THEMES = [
  { key: 'light', label: 'Light', icon: '🌞' },
  { key: 'dark', label: 'Dark', icon: '🌚' },
  { key: 'high-contrast', label: 'High Contrast', icon: '🔳' },
];

const THEME_KEY = 'brixsport_theme';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem(THEME_KEY) || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'high-contrast');
    document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <div className="flex gap-2 items-center">
      {THEMES.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`px-2 py-1 rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${theme === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          aria-pressed={theme === t.key}
          aria-label={`Switch to ${t.label} mode`}
          onClick={() => setTheme(t.key)}
        >
          <span aria-hidden>{t.icon}</span>
        </button>
      ))}
    </div>
  );
}; 