import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationsContext';
import { useRouter } from 'next/navigation';

interface NotificationsBadgeProps {
  className?: string;
  onClick?: () => void;
}

const NotificationsBadge: React.FC<NotificationsBadgeProps> = ({ className = '', onClick }) => {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <button 
      className={`p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative ${className}`}
      aria-label="Notifications"
      onClick={handleClick}
      type="button"
    >
      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
      {unreadCount > 0 && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  );
};

export default NotificationsBadge;