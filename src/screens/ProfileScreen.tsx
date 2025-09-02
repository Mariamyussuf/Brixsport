'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from '@/components/shared/UserProfile';
import { FavoritesAPI, FavoriteItem } from '@/lib/api';
import { useTheme } from '@/components/shared/ThemeProvider';
import SettingsLauncher from '@/components/shared/SettingsLauncher';
import Favouritesscreen from '@/components/FootballScreen/Favouritesscreen';

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
  Gamepad2,
  Star,
  BarChart3,
  Plus,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const ProfileScreen = () => {
  const { user, logout, loading: authLoading, error } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  
  // Fetch user favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      
      setLoadingFavorites(true);
      setFavoritesError(null);
      
      try {
        const data = await FavoritesAPI.getAll();
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setFavoritesError('Failed to load favorites. Please try again.');
      } finally {
        setLoadingFavorites(false);
      }
    };
    
    fetchFavorites();
  }, [user]);
  
  // Handle removing favorite
  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await FavoritesAPI.remove({ id: favoriteId });
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

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
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const handleTipsAndSupport = () => {
    setShowModal('support');
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
      icon: <Gamepad2 className="h-6 w-6" />, 
      text: 'Games', 
      onClick: () => router.push('/games') 
    },
    { 
      icon: <Star className="h-6 w-6" />, 
      text: 'Favorites', 
      onClick: () => router.push('/favorites') 
    },
    { 
      icon: <BarChart3 className="h-6 w-6" />, 
      text: 'Reports', 
      onClick: () => router.push('/reports') 
    },
    { 
      icon: <HelpCircle className="h-6 w-6" />, 
      text: 'Support', 
      onClick: handleTipsAndSupport 
    },
    { 
      icon: <Plus className="h-6 w-6" />, 
      text: 'Add', 
      onClick: () => {}, 
      isAdd: true 
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-slate-900 dark:text-white">

      <div className="px-4 pb-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <SettingsLauncher />
        </header>

        {/* User Profile Section */}
        <div className="flex flex-col items-center text-center mb-8">
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
              <h2 className="text-xl font-semibold mt-4">{user?.name || 'Guest User'}</h2>
              <p className="text-slate-600 dark:text-gray-400">{user?.email}</p>
              {user?.role && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  {user.role}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                </div>
              </div>
              <h2 className="text-xl font-medium mb-2">
                Your home for sports insights
              </h2>
            </>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Favorites Section - Updated to use the same component as the bottom nav */}
        {user && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 mb-8">
            <h3 className="text-lg font-semibold mb-4">Your Favorites</h3>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
              <Favouritesscreen activeSport="all" />
            </div>
          </div>
        )}

        {/* Quick Links Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={link.onClick}
              className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95"
              aria-label={link.text}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                {link.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{link.text}</span>
            </button>
          ))}
        </div>

        {/* Action Button */}
        {!user ? (
          <Button 
            onClick={() => router.push('/auth/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full mb-8"
          >
            SIGN IN
          </Button>
        ) : (
          <Button 
            onClick={handleShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full mb-8 flex items-center justify-center space-x-2"
          >
            {shareSuccess ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span>{shareSuccess ? "SHARED!" : "SHARE BRIXSPORTS"}</span>
          </Button>
        )}

        {/* Remove Ads Banner */}
        <div className="bg-blue-600 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Wifi className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">Remove ads</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-white/10 border border-white/30"
          >
            Learn more
          </Button>
        </div>
      </div>

      {/* Share Success Toast */}
      {shareSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Check className="h-4 w-4" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Modals - All your original modals preserved */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {showModal === 'social' && 'Follow Us'}
                  {showModal === 'privacy' && 'Privacy Policy'}
                  {showModal === 'support' && 'Help & Support'}
                  {showModal === 'about' && 'About Brixsports'}
                  {showModal === 'more' && 'More Options'}
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
                      <SocialLink platform="Instagram" url="https://instagram.com/brixsports" />
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
                        <p>Technical issues: <a href="mailto:support@brixsports.com" className="text-blue-600 dark:text-blue-400">support@brixsports.com</a></p>
                        <p>Feature requests: <a href="mailto:feedback@brixsports.com" className="text-blue-600 dark:text-blue-400">feedback@brixsports.com</a></p>
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

                {showModal === 'more' && (
                  <div className="space-y-2">
                    <MenuItem icon={<Share2 />} text="Share Brixsports" onClick={handleShare} />
                    <MenuItem icon={<Users />} text="Follow Us" onClick={handleFollowUs} />
                    <MenuItem icon={<Shield />} text="Change Password" onClick={handleChangePassword} />
                    <MenuItem icon={<LogOut />} text="Logout" onClick={handleLogout} isDestructive />
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