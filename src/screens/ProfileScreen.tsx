'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from '@/components/shared/UserProfile';
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
  Users, 
  FileText, 
  Lightbulb,
  Check,
  Copy,
  X,
  Bell,
  Calendar,
  TrendingUp,
  Trophy,
  Plus,
  Wifi,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const ProfileScreen = () => {
  const { user, logout, loading: authLoading, error, demoLogin } = useAuth();
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
    router.push('/auth/login');
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
      icon: <TrendingUp className="h-6 w-6" />, 
      text: 'Stats', 
      onClick: () => router.push('/statistics') 
    },
    { 
      icon: <Trophy className="h-6 w-6" />, 
      text: 'Competition', 
      onClick: () => router.push('/competition') 
    },
    { 
      icon: <HelpCircle className="h-6 w-6" />, 
      text: 'Support', 
      onClick: handleTipsAndSupport 
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

  const handleChangePassword = () => {
    router.push('/auth/change-password');
  };

  const closeModal = () => {
    setShowModal(null);
  };

  // Convert your existing features to the new format
  const features = [
    { text: 'Real-time event tracking', completed: true },
    { text: 'Formation management', completed: true },
    { text: 'Statistics and analytics', completed: true },
    { text: 'Offline support', completed: true }
  ];

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
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
          </div>
          <SettingsLauncher />
        </header>

        {/* Main Content - Responsive Grid for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
          {/* User Profile Section - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2">
            <div className="flex flex-col items-center text-center mb-4 bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-500">{error.message}</p>
              ) : user ? (
                <>
                  <UserProfile
                    playerImage={user?.image || ''}
                    playerName={user?.name || 'Guest'}
                  />
                  <h2 className="text-xl sm:text-2xl font-semibold mt-4">{user?.name || 'Guest User'}</h2>
                  <p className="text-slate-600 dark:text-gray-400 mt-1">{user?.email}</p>
                  {user?.role && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-3">
                      {user.role}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-medium mb-2">
                    Your home for sports insights
                  </h2>
                  <p className="text-slate-600 dark:text-gray-400 mb-6 max-w-md">
                    Sign up or log in to access your favorites, track events, and more.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <Button 
                      onClick={() => router.push('/auth/signup')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
                    >
                      Sign Up
                    </Button>
                    <Button 
                      onClick={() => router.push('/auth/login')}
                      variant="outline"
                      className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600"
                    >
                      Log In
                    </Button>
                  </div>
                  <Button 
                    onClick={async () => {
                      try {
                        await demoLogin();
                      } catch (error) {
                        console.error('Demo login failed:', error);
                      }
                    }}
                    variant="ghost"
                    className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Try Demo Account
                  </Button>
                </>
              )}
            </div>

            {/* Features List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links Section - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={link.onClick}
                    className="flex flex-col items-center justify-center py-3 px-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95 border border-gray-100 dark:border-gray-700"
                    aria-label={link.text}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                      {link.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{link.text}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Additional Menu Items */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">More</h3>
              <div className="space-y-2">
                <MenuItem 
                  icon={<Users className="h-5 w-5" />} 
                  text="Follow Us" 
                  onClick={handleFollowUs} 
                />
                <MenuItem 
                  icon={<Shield className="h-5 w-5" />} 
                  text="Privacy Policy" 
                  onClick={handlePrivacyPolicy} 
                />
                <MenuItem 
                  icon={<HelpCircle className="h-5 w-5" />} 
                  text="Help & Support" 
                  onClick={handleTipsAndSupport} 
                />
                <MenuItem 
                  icon={<Info className="h-5 w-5" />} 
                  text="About Brixsports" 
                  onClick={handleAbout} 
                />
              </div>
            </div>
            
            {/* Share and Logout Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              {/* Share Button */}
              {user && (
                <Button
                  onClick={handleShare}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-xl w-full flex items-center justify-center space-x-3 shadow-sm"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="font-medium">{shareSuccess ? "SHARED!" : "SHARE BRIXSPORTS"}</span>
                </Button>
              )}
              
              {/* Logout Button */}
              {user && (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="mt-3 py-2.5 px-6 rounded-xl w-full flex items-center justify-center space-x-3 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Share Success Toast */}
        {shareSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
            <Check className="h-4 w-4" />
            <span>Link copied to clipboard!</span>
          </div>
        )}
      </div>

      {/* Modals - All your original modals preserved */}
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
                    <div className="space-y-3">
                      <SocialLink platform="Twitter" url="https://twitter.com/brixsports" />
                      <SocialLink platform="Facebook" url="https://facebook.com/brixsports" />
                      <SocialLink platform="Instagram" url="https://www.instagram.com/brixsports?utm_source=qr&igsh=MWZtNG5sNW5xNDU2aw==" />
                      <SocialLink platform="Snapchat" url="https://www.snapchat.com/add/brixsports?share_id=oNUySWww-dU&locale=en-NG" />
                      <SocialLink platform="TikTok" url="https://www.tiktok.com/@brixsports7?_t=ZS-8zOVaWpLoHc&_r=1" />
                    </div>
                  </>
                )}
                
                {showModal === 'privacy' && (
                  <div className="text-sm space-y-4 text-gray-600 dark:text-gray-300">
                    <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">1. Information We Collect</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>User account information (name, email)</li>
                        <li>Usage data for improving our services</li>
                        <li>Device information for analytics</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">2. How We Use Your Information</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>To provide and maintain our service</li>
                        <li>To notify you about changes to our service</li>
                        <li>To provide customer support</li>
                        <li>To gather analysis or valuable information</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">3. Data Security</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>We implement appropriate security measures to protect your data</li>
                        <li>All data is encrypted in transit and at rest</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">4. Your Rights</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>You have the right to access, update, or delete your information</li>
                        <li>Contact us at privacy@brixsports.com for any requests</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {showModal === 'support' && (
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <div>
                      <h4 className="font-semibold mb-2">Getting Started</h4>
                      <ol className="list-decimal pl-5 space-y-1 text-sm">
                        <li>Create an account to save your favorite teams</li>
                        <li>Use the event logger to track match events</li>
                        <li>Enable notifications to stay updated</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Tips</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Use offline mode to log events without internet</li>
                        <li>Check the formations screen to plan your team strategy</li>
                        <li>View statistics to analyze team performance</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Contact Support</h4>
                      <div className="space-y-2 text-sm">
                        <p>Technical issues: <a href="mailto:brixsports2025@gmail.com" className="text-blue-600 dark:text-blue-400">brixsports2025@gmail.com</a></p>
                        <p>Feature requests: <a href="mailto:brixsports2025@gmail.com" className="text-blue-600 dark:text-blue-400">brixsports2025@gmail.com</a></p>
                      </div>
                    </div>
                  </div>
                )}
                
                {showModal === 'about' && (
                  <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                    </div>
                    
                    <p className="text-sm">
                      Brixsports is a campus sports tracking application designed to help coaches, 
                      analysts, and sports teams log, visualize, and analyze player and team performance.
                    </p>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Real-time event tracking</li>
                        <li>Formation management</li>
                        <li>Statistics and analytics</li>
                        <li>Offline support</li>
                        <li>Cross-device synchronization</li>
                      </ul>
                    </div>
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
      
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full">
            <div className="p-5 sm:p-6">
              <div className="mb-5 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-600 dark:text-gray-400">Are you sure you want to logout? Any unsynchronized data will be kept locally until you log back in.</p>
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

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 py-1 px-3 ${active ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
  >
    <div className="w-6 h-6">{icon}</div>
    <span className="text-xs font-medium">{text}</span>
    {active && <div className="w-6 h-0.5 bg-blue-600 rounded-full"></div>}
  </button>
);

interface SocialLinkProps {
  platform: string;
  url: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ platform, url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleVisit = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span className="font-medium">{platform}</span>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center space-x-1"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleVisit}
        >
          Visit
        </Button>
      </div>
    </div>
  );
};

export default ProfileScreen;