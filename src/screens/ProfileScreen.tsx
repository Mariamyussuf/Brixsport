'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MinimalUserProfile from '@/components/shared/MinimalUserProfile';
import { useTheme } from '@/components/shared/ThemeProvider';
import SettingsLauncher from '@/components/shared/SettingsLauncher';

import { 
  Settings, 
  HelpCircle, 
  Info, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Share2,
  Check,
  X,
  Bell,
  Calendar,
  Trophy,
  Users,
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const ProfileScreen = () => {
  const { user, logout, loading: authLoading, error } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    if (!authLoading.initializing) {
      setLoading(false);
    }
  }, [authLoading.initializing]);

  // Handle navigation error case
  useEffect(() => {
    if (error && error.type === 'UNAUTHORIZED') {
      router.push('/auth/login');
    }
  }, [error, router]);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const handleTipsAndSupport = () => {
    setShowModal('support');
  };

  const handleLogout = () => {
    // Show logout confirmation dialog
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Perform the actual logout
    logout();
    setShowLogoutConfirm(false);
    // Redirect to user login page on the same domain
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      // For localhost development, stay on the same host
      if (currentHost.startsWith('localhost') || currentHost.includes('vercel.app')) {
        router.push('/auth/login');
      } else {
        // For production, redirect to the main domain
        window.location.href = 'https://brixsports.com/auth/login';
      }
    } else {
      router.push('/auth/login');
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  // Define quickLinks array
  const quickLinks = [
    { 
      icon: <Bell className="h-6 w-6" />, 
      text: 'Notifications', 
      onClick: () => router.push('/notifications') 
    },
    { 
      icon: <Calendar className="h-6 w-6" />, 
      text: 'Events', 
      onClick: () => router.push('/events') 
    },
    { 
      icon: <Trophy className="h-6 w-6" />, 
      text: 'Competition', 
      onClick: () => router.push('/competition') 
    },
    { 
      icon: <Users className="h-6 w-6" />, 
      text: 'Teams', 
      onClick: () => router.push('/teams') 
    }
  ];

  const handleShare = async () => {
    const shareData = {
      title: 'Brixsports',
      text: 'Check out Brixsports - the best way to track campus sports events!',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      try {
        await navigator.clipboard.writeText(shareData.url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (copyErr) {
        console.error('Error copying to clipboard:', copyErr);
        alert('Copy this link: ' + shareData.url);
      }
    }
  };

  const handleFollowUs = () => {
    setShowModal('social');
  };

  const handlePrivacyPolicy = () => {
    setShowModal('privacy');
  };

  const handleAbout = () => {
    setShowModal('about');
  };

  const closeModal = () => {
    setShowModal(null);
  };

  // Your existing menu items converted to quick links format
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-white">

      <div className="py-4 max-w-full">
        {/* Header */}
        <header className="flex items-center justify-between py-3 px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
          </div>
          <SettingsLauncher />
        </header>

        {/* Main Content - Simplified to single column */}
        <div className="max-w-md mx-auto px-4">
          {/* User Profile Section - Simplified */}
          <div className="mb-6">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error.message}</p>
            ) : user ? (
              <MinimalUserProfile
                playerImage={user?.image || ''}
                playerName={user?.name || 'Guest'}
                email={user?.email || ''}
                onLogout={handleLogout}
                onSettings={() => router.push('/settings')}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <h2 className="text-xl font-medium mb-2">
                  Your home for sports insights
                </h2>
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                  Sign up or log in to access your favorites, track events, and more.
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => router.push('/auth/signup')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    Sign Up
                  </Button>
                  <Button 
                    onClick={() => router.push('/auth/login')}
                    variant="outline"
                    className="w-full py-3 border border-gray-300 dark:border-gray-600"
                  >
                    Log In
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links Section - Simplified */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={link.onClick}
                  className="flex flex-col items-center justify-center py-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all"
                  aria-label={link.text}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                    {link.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.text}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Additional Menu Items - Simplified */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">More</h3>
            <div className="space-y-2">
              <MenuItem 
                icon={<MessageCircle className="h-5 w-5" />} 
                text="FAQ" 
                onClick={() => router.push('/faq')} 
              />
              <MenuItem 
                icon={<BookOpen className="h-5 w-5" />} 
                text="Blog" 
                onClick={() => router.push('/blog')} 
              />
              <MenuItem 
                icon={<Shield className="h-5 w-5" />} 
                text="Privacy Policy" 
                onClick={handlePrivacyPolicy} 
              />
              <MenuItem 
                icon={<Info className="h-5 w-5" />} 
                text="About Brixsports" 
                onClick={handleAbout} 
              />
            </div>
          </div>
          
          {/* Share Button */}
          {user && (
            <Button
              onClick={handleShare}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center space-x-3 shadow-sm mb-6"
            >
              <Share2 className="h-5 w-5" />
              <span className="font-medium">{shareSuccess ? "SHARED!" : "SHARE BRIXSPORTS"}</span>
            </Button>
          )}
        </div>

        {/* Share Success Toast */}
        {shareSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Check className="h-4 w-4" />
            <span>Link copied to clipboard!</span>
          </div>
        )}
      </div>

      {/* Modals - Simplified */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {showModal === 'social' && 'Follow Us'}
                  {showModal === 'privacy' && 'Privacy Policy'}
                  {showModal === 'support' && 'Help & Support'}
                  {showModal === 'about' && 'About Brixsports'}
                </h3>
                <Button variant="ghost" size="icon" onClick={closeModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {showModal === 'social' && (
                  <>
                    <p className="text-gray-600 dark:text-gray-400">
                      Stay connected with us on social media for updates, tips, and community discussions!
                    </p>
                  </>
                )}
                
                {showModal === 'privacy' && (
                  <div className="text-sm space-y-4 text-gray-600 dark:text-gray-300">
                    <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                    <p>
                      We take your privacy seriously. This policy explains how we collect, 
                      use, and protect your personal information.
                    </p>
                    <div>
                      <h4 className="font-semibold mb-2">Information We Collect</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Account information (name, email)</li>
                        <li>Usage data to improve our services</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {showModal === 'support' && (
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <div>
                      <h4 className="font-semibold mb-2">Getting Started</h4>
                      <p className="text-sm">
                        Create an account to save your favorite teams and use the event logger to track match events.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Contact Support</h4>
                      <p className="text-sm">
                        For technical issues or feature requests: 
                        <a href="mailto:brixsports2025@gmail.com" className="text-blue-600 dark:text-blue-400 ml-1">
                          brixsports2025@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                )}
                
                {showModal === 'about' && (
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                    </div>
                    <p className="text-sm">
                      Brixsports is a campus sports tracking application designed to help coaches, 
                      analysts, and sports teams log, visualize, and analyze player and team performance.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={closeModal} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Logout Confirmation Dialog - Simplified */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full">
            <div className="p-5 sm:p-6">
              <div className="mb-5 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-600 dark:text-gray-400">Are you sure you want to logout?</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cancelLogout}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmLogout}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onClick, isDestructive }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center text-left p-3 rounded-md transition-colors ${
      isDestructive
        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
    }`}
  >
    <div className="mr-4 text-gray-600 dark:text-gray-300">{icon}</div>
    <span className="flex-grow font-medium">{text}</span>
    {!isDestructive && <ChevronRight className="h-5 w-5 text-gray-400" />}
  </button>
);

export default ProfileScreen;