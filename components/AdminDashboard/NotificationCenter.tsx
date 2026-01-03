import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Bell, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { Notification } from '../../types';
import { useToast } from '../ui/Toast';
import { notifications as apiNotifications } from '../../services/api';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationsUpdate: (notifications: Notification[]) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationsUpdate,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [notifFilter, setNotifFilter] = useState<'All' | 'Alerts' | 'System' | 'Info'>('All');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (notifFilter === 'All') return true;
      if (notifFilter === 'Alerts') return n.type === 'alert' || n.type === 'warning';
      if (notifFilter === 'System') return n.type === 'system';
      if (notifFilter === 'Info') return n.type === 'info';
      return true;
    });
  }, [notifications, notifFilter]);

  const markAsRead = async (id: string) => {
    try {
      await apiNotifications.markAsRead(id);
      const updated = notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      );
      onNotificationsUpdate(updated);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error(t('admin.notifications.markReadError'));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = filteredNotifications.filter(n => !n.isRead).map(n => n.id);
    try {
      await Promise.all(unreadIds.map(id => apiNotifications.markAsRead(id)));
      const updated = notifications.map(n => 
        unreadIds.includes(n.id) ? { ...n, isRead: true } : n
      );
      onNotificationsUpdate(updated);
      toast.success(t('admin.notifications.allMarkedRead'));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast.error(t('admin.notifications.markReadError'));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[100] flex flex-col border-l border-gray-200"
        >
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{t('admin.notifications.title')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredNotifications.filter(n => !n.isRead).length} {t('admin.notifications.unread')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={markAllAsRead}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={t('admin.notifications.markAllRead')}
              >
                <CheckSquare size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 p-3 border-b border-gray-200 overflow-x-auto bg-gray-50">
            {['All', 'Alerts', 'System', 'Info'].map(f => (
              <button 
                key={f} 
                onClick={() => setNotifFilter(f as any)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  notifFilter === f 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t(`admin.notifications.filters.${f.toLowerCase()}`)}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">{t('admin.notifications.noNotifications')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('admin.notifications.noNotificationsDesc')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      n.isRead ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(n.type || 'info')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-bold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {n.title || t('admin.notifications.noTitle')}
                          </p>
                          {!n.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {n.message || n.body || t('admin.notifications.noMessage')}
                        </p>
                        {n.timestamp && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

