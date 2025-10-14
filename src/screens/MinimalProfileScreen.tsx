'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MinimalUserProfile from '@/components/shared/MinimalUserProfile';
import { useTheme } from '@/components/shared/ThemeProvider';
import SettingsLauncher from '@/components/shared/SettingsLauncher';

import { 
  Bell, 
  Calendar, 
  Trophy, 
  Users, 
  HelpCircle, 
  Shield, 
  Info, 
  Share2,
  BookOpen,
  MessageCircle,
  ChevronRight,
  X,
  Check,
  Copy,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const MinimalProfileScreen = () => {
  const { user, logout, loading: authLoading, error } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    router.push('/auth/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Brixsports',
      text: 'Check out Brixsports - the best way to track campus sports events!',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
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

  const quickLinks = [
    { 
      icon: <Bell className="h-5 w-5" />, 
      text: 'Notifications', 
      onClick: () => router.push('/notifications') 
    },
    { 
      icon: <Calendar className="h-5 w-5" />, 
      text: 'Events', 
      onClick: () => router.push('/events') 
    },
    { 
      icon: <Trophy className="h-5 w-5" />, 
      text: 'Competitions', 
      onClick: () => router.push('/competitions') 
    },
    { 
      icon: <Users className="h-5 w-5" />, 
      text: 'Teams', 
      onClick: () => router.push('/teams') 
    }
  ];

  const menuItems = [
    { 
      icon: <HelpCircle className="h-5 w-5" />, 
      text: 'FAQ', 
      onClick: () => router.push('/faq') 
    },
    { 
      icon: <BookOpen className="h-5 w-5" />, 
      text: 'Blog', 
      onClick: () => router.push('/blog') 
    },
    { 
      icon: <Shield className="h-5 w-5" />, 
      text: 'Privacy Policy', 
      onClick: () => setShowModal('privacy') 
    },
    { 
      icon: <Info className="h-5 w-5" />, 
      text: 'About', 
      onClick: () => setShowModal('about') 
    }
  ];

  const closeModal = () => {
    setShowModal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <SettingsLauncher />
        </div>

        {/* User Profile */}
        {user ? (
          <MinimalUserProfile
            playerImage={user?.image || ''}
            playerName={user?.name || 'User'}
            email={user?.email || ''}
            onLogout={handleLogout}
            onSettings={() => router.push('/settings')}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to Brixsports
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign in to access your profile and features
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => router.push('/auth/signup')}
                className="flex-1"
              >
                Sign Up
              </Button>
              <Button 
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="flex-1"
              >
                Log In
              </Button>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link, index) => (
              <button
                key={index}
                onClick={link.onClick}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                  {link.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl mt-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center">
                <div className="mr-3 text-gray-600 dark:text-gray-300">
                  {item.icon}
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{item.text}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Share Button */}
        {user && (
          <Button
            onClick={handleShare}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3"
          >
            <Share2 className="h-5 w-5 mr-2" />
            {shareSuccess ? "Link Copied!" : "Share Brixsports"}
          </Button>
        )}

        {/* Share Success Toast */}
        {shareSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Check className="h-4 w-4" />
            <span>Link copied to clipboard!</span>
          </div>
        )}

        {/* Modals */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {showModal === 'privacy' && 'Privacy Policy'}
                    {showModal === 'about' && 'About Brixsports'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={closeModal}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  {showModal === 'privacy' && (
                    <>
                      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                      <p className="text-sm">
                        We take your privacy seriously. This policy explains how we collect, 
                        use, and protect your personal information.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2">Information We Collect</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Account information (name, email)</li>
                          <li>Usage data to improve our services</li>
                        </ul>
                      </div>
                    </>
                  )}
                  
                  {showModal === 'about' && (
                    <>
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                      </div>
                      <p className="text-sm">
                        Brixsports is a campus sports tracking application designed to help coaches, 
                        analysts, and sports teams log, visualize, and analyze player and team performance.
                      </p>
                    </>
                  )}
                </div>
                
                <div className="mt-6">
                  <Button onClick={closeModal} className="w-full">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
              <div className="p-5">
                <div className="mb-5 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Are you sure you want to logout?
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={cancelLogout} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={confirmLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalProfileScreen;