import React from 'react';
import { Menu, Search, Bell, RefreshCw, X } from 'lucide-react';
import { Notification } from '../../types';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from '../../contexts/TranslationContext';

interface HeaderProps {
  activeTab: string;
  setIsSidebarOpen: (open: boolean) => void;
  handleRefresh: () => void;
  isRefreshing: boolean;
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
  setShowSearchModal: (show: boolean) => void;
  notifications: Notification[];
  setIsNotificationsOpen: (open: boolean) => void;
  toast: {
    info: (message: string) => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setIsSidebarOpen,
  handleRefresh,
  isRefreshing,
  globalSearch,
  setGlobalSearch,
  setShowSearchModal,
  notifications,
  setIsNotificationsOpen,
  toast,
}) => {
  const { t } = useTranslation();
  return (
    <header className="bg-white border-b border-gray-200 py-2.5 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 flex justify-between items-center shrink-0 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 capitalize truncate">
          {activeTab.replace('-', ' ')}
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          title={t('admin.refreshData')}
          aria-label={t('admin.refresh')}
        >
          <RefreshCw size={18} className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Mobile Search Button */}
        <button 
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          onClick={() => {
            const search = prompt('Search...');
            if (search) {
              toast.info('Search functionality coming soon');
            }
          }}
          aria-label="Search"
        >
          <Search size={18} className="text-gray-600" />
        </button>
        
        {/* Desktop Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            className="pl-10 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-qatar rounded-full text-sm w-64 transition-all outline-none border" 
            placeholder={t('admin.searchAnything')} 
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              if (e.target.value.length > 0) {
                setShowSearchModal(true);
              }
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearchModal(true);
                e.currentTarget.focus();
              }
              if (e.key === 'Escape') {
                setGlobalSearch('');
                setShowSearchModal(false);
              }
            }}
            onClick={() => setShowSearchModal(true)}
          />
          {globalSearch && (
            <button
              onClick={() => {
                setGlobalSearch('');
                setShowSearchModal(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <LanguageSwitcher />
        
        <button 
          className="relative p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation" 
          onClick={() => setIsNotificationsOpen(true)}
          aria-label="Notifications"
        >
          <Bell size={18} className="sm:w-5 sm:h-5 text-gray-600" />
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

