"use client";
import React from "react";
import { X, Sun, Moon, Monitor, Settings } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useSettings } from "./SettingsContext";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { notifications, dataSaver, language, setNotifications, setDataSaver, setLanguage } = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100]">
      {/* Backdrop */}
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl border-t border-gray-200 dark:border-white/10">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-base font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-6">
          <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Appearance</div>
          {/* Debug line to verify state updates in production */}
          <div className="mb-2 text-[11px] text-gray-500 dark:text-gray-400">Theme: <strong>{theme}</strong> • Resolved: <strong>{resolvedTheme}</strong></div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/10 ${
                theme === "light" ? "border-blue-500" : "border-gray-200 dark:border-white/10"
              }`}
              data-theme="light"
              role="radio"
              aria-checked={theme === "light"}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/10 ${
                theme === "dark" ? "border-blue-500" : "border-gray-200 dark:border-white/10"
              }`}
              data-theme="dark"
              role="radio"
              aria-checked={theme === "dark"}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/10 ${
                theme === "system" ? "border-blue-500" : "border-gray-200 dark:border-white/10"
              }`}
              data-theme="system"
              role="radio"
              aria-checked={theme === "system"}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="px-5 pb-6">
          <div className="mb-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Notifications</div>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white/60 dark:bg-slate-900/40">
            <div>
              <div className="text-sm font-medium">Enable notifications</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Get updates about matches and favourites</div>
            </div>
            <button
              role="switch"
              aria-checked={notifications}
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="px-5 pb-6">
          <div className="mb-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Language</div>
          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white/60 dark:bg-slate-900/40">
            <label htmlFor="language-select" className="text-sm font-medium block mb-2">App language</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        {/* Data Saver */}
        <div className="px-5 pb-8">
          <div className="mb-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Data</div>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white/60 dark:bg-slate-900/40">
            <div>
              <div className="text-sm font-medium">Data saver</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Reduce image quality and background refresh</div>
            </div>
            <button
              role="switch"
              aria-checked={dataSaver}
              onClick={() => setDataSaver(!dataSaver)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dataSaver ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${dataSaver ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
