'use client';
import React, { useState, useRef } from 'react';
import { User, Edit2, Camera, Check, X, Upload, Settings, LogOut, Trophy, Users, Award, Bell, MessageCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfileProps {
  playerImage?: string;
  playerName: string;
  email?: string;
  stats?: {
    matches: number;
    teams: number;
    competitions: number;
  };
  onImageChange?: (file: File) => Promise<void>;
  onSave?: (data: { name: string; email: string }) => Promise<void>;
  onLogout?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  playerImage = '',
  playerName,
  email = '',
  stats = { matches: 0, teams: 0, competitions: 0 },
  onImageChange,
  onSave,
  onLogout
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playerName);
  const [userEmail, setUserEmail] = useState(email);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image if handler provided
    if (onImageChange) {
      try {
        setIsLoading(true);
        await onImageChange(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        setIsLoading(true);
        await onSave({ name, email: userEmail });
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to save profile:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
        {/* Header with cover photo and profile */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-800 h-48">
          <div className="absolute -bottom-16 left-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-900 shadow-lg">
                {imagePreview || playerImage ? (
                  <AvatarImage src={imagePreview || playerImage} alt={name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl">
                    {getInitials(name)}
                  </AvatarFallback>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={handleEditClick}
                className="absolute -right-2 -bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Edit2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 right-6 flex space-x-2">
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                ) : (
                  name
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isEditing ? (
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                ) : (
                  userEmail || 'Member since 2023'
                )}
              </p>
            </div>
            {isEditing && (
              <Button onClick={handleSave} disabled={isLoading} className="mt-4 md:mt-0">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Matches"
              value={stats.matches}
              icon={<Trophy className="h-5 w-5 text-blue-600" />}
              description="Total matches followed"
            />
            <StatCard
              title="Teams"
              value={stats.teams}
              icon={<Users className="h-5 w-5 text-indigo-600" />}
              description="Teams tracked"
            />
            <StatCard
              title="Competitions"
              value={stats.competitions}
              icon={<Award className="h-5 w-5 text-purple-600" />}
              description="Active competitions"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent interactions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ActivityItem
                      icon={<Bell className="h-5 w-5 text-blue-600" />}
                      title="New match added to your favorites"
                      time="2 hours ago"
                    />
                    <ActivityItem
                      icon={<MessageCircle className="h-5 w-5 text-green-600" />}
                      title="New comment on your post"
                      time="5 hours ago"
                    />
                    <ActivityItem
                      icon={<TrendingUp className="h-5 w-5 text-yellow-600" />}
                      title="Your team is trending"
                      time="1 day ago"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <NotificationPreference
                      title="Match Updates"
                      description="Get notifications for match starts, goals, and results"
                      enabled={true}
                    />
                    <NotificationPreference
                      title="Team News"
                      description="Receive updates about your favorite teams"
                      enabled={true}
                    />
                    <NotificationPreference
                      title="Special Offers"
                      description="Get exclusive offers and promotions"
                      enabled={false}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" className="mt-1" />
                      </div>
                      <Button>Update Password</Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Email Preferences</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="emailUpdates" className="rounded" defaultChecked />
                        <label htmlFor="emailUpdates" className="text-sm font-medium">
                          Receive email updates
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="marketingEmails" className="rounded" defaultChecked />
                        <label htmlFor="marketingEmails" className="text-sm font-medium">
                          Receive marketing emails
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                    <div className="border border-red-200 dark:border-red-900 rounded-lg p-4">
                      <h4 className="font-medium text-red-600 dark:text-red-400">Delete Account</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive">
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, description }: { title: string; value: number; icon: React.ReactNode; description: string }) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const ActivityItem = ({ icon, title, time }: { icon: React.ReactNode; title: string; time: string }) => (
  <div className="flex items-start space-x-3">
    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-medium text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{time}</p>
    </div>
  </div>
);

const NotificationPreference = ({ title, description, enabled }: { title: string; description: string; enabled: boolean }) => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div>
      <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <div className="flex items-center">
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  </div>
);

export default UserProfile;
