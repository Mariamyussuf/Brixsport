"use client";
import React, { useState } from "react";
import { X, Sun, Moon, Monitor, Settings, Bell, Clock, User, Users, Trophy, Mail, Key, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useSettings } from "./SettingsContext";
import { useNotifications } from "@/components/shared/NotificationsContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/lib/userService";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { dataSaver, language, setNotifications, setDataSaver, setLanguage } = useSettings();
  const { preferences, updatePreferences } = useNotifications();
  const { user, logout } = useAuth();
  const [quietHoursStart, setQuietHoursStart] = useState(preferences.quietHours?.start || '22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState(preferences.quietHours?.end || '08:00');
  const router = useRouter();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!open) return null;

  const handleToggleEnabled = () => {
    updatePreferences({ 
      deliveryMethods: {
        ...preferences.deliveryMethods,
        inApp: !preferences.deliveryMethods.inApp
      }
    });
    setNotifications(!preferences.deliveryMethods.inApp);
  };

  const handleToggleImportantOnly = () => {
    // This setting doesn't exist in the new preferences structure
    // We'll just toggle the score alerts category instead
    updatePreferences({ 
      categories: {
        ...preferences.categories,
        scoreAlerts: !preferences.categories.scoreAlerts
      }
    });
  };

  const handleToggleDeliveryMethod = (method: 'push' | 'inApp' | 'email' | 'sms') => {
    updatePreferences({
      deliveryMethods: {
        ...preferences.deliveryMethods,
        [method]: !preferences.deliveryMethods[method]
      }
    });
  };

  const handleQuietHoursChange = () => {
    updatePreferences({
      quietHours: {
        enabled: true, // Add the missing enabled property
        start: quietHoursStart,
        end: quietHoursEnd
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    
    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  // Get default theme from environment variables
  const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME || 'system';

  // Get available themes from environment variables
  const availableThemes = (process.env.NEXT_PUBLIC_THEMES?.split(',') || ['light', 'dark', 'system']) as Array<"light" | "dark" | "system">;

  return (
    <div className="fixed inset-0 z-[1100]">
      {/* Backdrop */}
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl border-t border-gray-200 dark:border-white/10">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-gray-100 dark:border-white/10">
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
            {availableThemes.map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/10 ${
                  theme === themeOption ? "border-blue-500" : "border-gray-200 dark:border-white/10"
                }`}
                data-theme={themeOption}
                role="radio"
                aria-checked={theme === themeOption}
              >
                {themeOption === 'light' && <Sun className="w-5 h-5" />}
                {themeOption === 'dark' && <Moon className="w-5 h-5" />}
                {themeOption === 'system' && <Monitor className="w-5 h-5" />}
                <span className="text-xs">{themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="px-5 pb-6">
          <div className="mb-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Notifications</div>
          
          {/* General Settings */}
          <div className="space-y-4 mb-6">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Enable notifications</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Get updates about matches and favourites</div>
              </div>
              <button
                role="switch"
                aria-checked={preferences.deliveryMethods.inApp}
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.inApp ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.inApp ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {/* Important Only */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Important Events Only</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Only receive notifications for important events</div>
              </div>
              <button
                onClick={handleToggleImportantOnly}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.categories.scoreAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.categories.scoreAlerts ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          {/* Delivery Methods */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium">Push Notifications</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Instant alerts even when app is closed</div>
                </div>
              </div>
              <button
                onClick={() => handleToggleDeliveryMethod('push')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.push ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.push ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                  <Bell className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-sm font-medium">In-App Notifications</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Banners while using the app</div>
                </div>
              </div>
              <button
                onClick={() => handleToggleDeliveryMethod('inApp')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.inApp ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.inApp ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white mr-3">
                  <Mail className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-sm font-medium">Email Digest</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Weekly summary via email</div>
                </div>
              </div>
              <button
                onClick={() => handleToggleDeliveryMethod('email')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.email ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.email ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          {/* Quiet Hours */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
              <div className="text-sm font-medium">Quiet Hours</div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Notifications will be silenced during these hours
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start
                </label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  onBlur={handleQuietHoursChange}
                  className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End
                </label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  onBlur={handleQuietHoursChange}
                  className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Follow Preferences */}
          <div>
            <div className="flex items-center mb-3">
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
              <div className="text-sm font-medium">Follow Preferences</div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Choose what you want to follow for notifications
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <div>
                  <div className="text-sm font-medium">Teams</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preferences.followedTeams.length > 0 
                      ? `${preferences.followedTeams.length} teams followed` 
                      : 'No teams followed'}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/favorites')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <div>
                  <div className="text-sm font-medium">Players</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preferences.followedPlayers.length > 0 
                      ? `${preferences.followedPlayers.length} players followed` 
                      : 'No players followed'}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/favorites')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <div>
                  <div className="text-sm font-medium">Competitions</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preferences.followedCompetitions.length > 0 
                      ? `${preferences.followedCompetitions.length} competitions followed` 
                      : 'No competitions followed'}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/favorites')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Manage
                </button>
              </div>
            </div>
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
        <div className="px-5 pb-6">
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

        {/* Account Settings - Only show if user is logged in */}
        {user && (
          <div className="px-5 pb-6">
            <div className="mb-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</div>
            
            {/* Change Password */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white/60 dark:bg-slate-900/40 mb-4">
              <div className="flex items-center mb-3">
                <Key className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <div className="text-sm font-medium">Change Password</div>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label htmlFor="current-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At least 6 characters</p>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    required
                  />
                </div>
                
                {passwordError && (
                  <div className="text-red-500 text-sm">{passwordError}</div>
                )}
                
                {passwordSuccess && (
                  <div className="text-green-500 text-sm">Password changed successfully!</div>
                )}
                
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
            
            {/* Logout */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-white/60 dark:bg-slate-900/40">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}