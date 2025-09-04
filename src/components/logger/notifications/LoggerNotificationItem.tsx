import React from 'react';
import { X, Goal, CreditCard, User, Calendar, AlertCircle } from 'lucide-react';

interface LoggerNotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
  onClick?: () => void;
}

const LoggerNotificationItem: React.FC<LoggerNotificationItemProps> = ({ 
  notification, 
  onMarkAsRead,
  onClick
}) => {
  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'goal':
        return <Goal className="w-4 h-4 text-green-500" />;
      case 'yellow-card':
      case 'red-card':
        return <CreditCard className="w-4 h-4 text-yellow-500" />;
      case 'substitution':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'injury':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'kickoff':
      case 'full-time':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Get color based on notification type
  const getColorClass = () => {
    switch (notification.type) {
      case 'goal':
        return 'border-l-green-500';
      case 'yellow-card':
        return 'border-l-yellow-500';
      case 'red-card':
        return 'border-l-red-500';
      case 'substitution':
        return 'border-l-blue-500';
      case 'injury':
        return 'border-l-red-500';
      case 'kickoff':
      case 'full-time':
        return 'border-l-purple-500';
      default:
        return 'border-l-gray-500';
    }
  };
  
  return (
    <div 
      className={`p-3 border-b border-l-4 ${getColorClass()} border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <div className="mr-2">
              {getIcon()}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="ml-2 inline-flex items-center justify-center w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Mark as read"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LoggerNotificationItem;